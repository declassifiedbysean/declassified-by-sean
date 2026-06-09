// src/game/Room.js — one game. Authoritative phase machine. The server owns the truth.
// Phases: ROUND_START -> PAINT -> NAME -> SEAL -> CROWN -> FLAG -> REVEAL/SCORE -> (loop) -> FINALE
import { nanoid } from 'nanoid';
import config from '../config.js';
import imagegen from '../services/imagegen.js';
import llm from '../services/llm.js';
import * as heat from './heat.js';
import { tallyRound } from './scoring.js';
import elo from './elo.js';
import { cleanName } from '../moderation/filter.js';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export class Room {
  constructor({ code, bus, store, isPrivate = false }) {
    this.code = code;
    this.bus = bus;       // { send(playerId,msg), broadcast(code,msg) }
    this.store = store;
    this.isPrivate = isPrivate;
    this.players = [];    // {id,name,isBot,connected,score,streak,onFire,_mult,_lock}
    this.started = false;
    this.ended = false;
    this.captainIdx = -1;
    this.history = [];    // works this game
    this.hostId = null;   // C2: the first human seated is the host; only they can start
    this._collect = null; // active collection
  }

  // ---- membership ----
  addPlayer(p) {
    p.score = 0; p.streak = 0; p.onFire = false; p.connected = true;
    this.players.push(p);
    if (!this.hostId && !p.isBot) this.hostId = p.id; // C2
    this.broadcast({ t: 'room.update', code: this.code, players: this.publicPlayers(), started: this.started });
  }
  removePlayer(id) {
    const p = this.players.find((x) => x.id === id);
    if (p) p.connected = false;
    // if a disconnected player was expected in a collection, stop waiting on them
    if (this._collect) { this._collect.expected.delete(id); this._maybeResolve(); }
    this.broadcast({ t: 'room.update', code: this.code, players: this.publicPlayers(), started: this.started });
  }
  publicPlayers() {
    return this.players.map((p) => ({ id: p.id, name: p.name, isBot: !!p.isBot, score: p.score, onFire: !!p.onFire, connected: p.connected }));
  }
  humanIds() { return new Set(this.players.filter((p) => !p.isBot && p.connected).map((p) => p.id)); }
  totalRounds() { return this.players.length + config.roundsBonus; }

  send(id, msg) { this.bus.send(id, msg); }
  broadcast(msg) { this.bus.broadcast(this.code, msg); }

  // ---- lifecycle ----
  async start() {
    if (this.started) return;
    this.started = true;
    this.broadcast({ t: 'game.start', code: this.code, rounds: this.totalRounds(), players: this.publicPlayers() });
    try {
      for (let r = 1; r <= this.totalRounds(); r++) {
        if (this.humanIds().size === 0) break; // everyone left
        await this.playRound(r);
      }
    } catch (e) {
      this.broadcast({ t: 'error', msg: `round error: ${e.message}` });
    }
    await this.finale();
  }

  // ---- one round ----
  async playRound(roundNo) {
    // ROUND_START — rotate captain, choose & deliver the secret
    this.captainIdx = (this.captainIdx + 1) % this.players.length;
    const captain = this.players[this.captainIdx];
    const secret = await llm.chooseSecret();
    this.broadcast({ t: 'phase', name: 'ROUND_START', round: roundNo, rounds: this.totalRounds(), captain: captain.id });
    if (!captain.isBot && captain.connected) {
      this.send(captain.id, { t: 'role', captain: true, secret }); // only the captain learns the secret
    }

    // PAINT — the machine paints the secret as a clue (never names it)
    const painted = await imagegen.paint(secret);
    this.broadcast({ t: 'phase', name: 'PAINT', round: roundNo, piece: painted, captain: captain.id, nameSeconds: config.nameSeconds });

    // NAME — everyone names at once on one server clock. Captain bluffs (must differ from secret).
    const names = await this.collectNames({ secret, captain, piece: painted });

    // SEAL — inject the machine's own guess, shuffle, strip authorship
    const machineGuessName = await llm.machineGuess(painted.piece || 'the work');
    const machineEntryId = nanoid(8);
    const entries = [
      ...names.map((n) => ({ id: nanoid(8), name: n.name, byPlayerId: n.playerId, isMachine: false, isBot: n.isBot })),
      { id: machineEntryId, name: cleanName(machineGuessName), byPlayerId: null, isMachine: true, isBot: false },
    ];
    shuffle(entries);
    const lineup = entries.map((e) => ({ id: e.id, name: e.name }));

    // CROWN — humans confer worth: best (Sublime) and worst (Troll)
    this.broadcast({ t: 'phase', name: 'CROWN', round: roundNo, entries: lineup });
    const crownVotes = await this.collectVotes('crown', ['sublime', 'troll']);

    // FLAG — humans hunt the machine
    this.broadcast({ t: 'phase', name: 'FLAG', round: roundNo, entries: lineup });
    const flagVotes = await this.collectVotes('flag', ['flag']);

    // resolve per-player heat multiplier from their lock time
    for (const p of this.players) p._mult = heat.effectiveMultiplier(p, p._lock ?? config.nameSeconds);

    const result = tallyRound({
      entries,
      votes: { sublime: crownVotes.sublime, troll: crownVotes.troll, flag: flagVotes.flag },
      humans: this.humanIds(),
      machineEntryId,
      players: this.players,
      lockSeconds: config.nameSeconds,
    });

    // apply points + settle heat
    for (const p of this.players) {
      const won = !!result.crowns[p.id]?.length;
      p.score += result.points[p.id] || 0;
      heat.applyLockHeat(p, p._lock ?? config.nameSeconds);
      heat.settleRoundHeat(p, won);
    }

    const nameOf = (id) => entries.find((e) => e.id === id)?.name || null;
    const sublimeName = nameOf(result.sublimeEntry);
    const trollName = nameOf(result.trollEntry);
    this.history.push({ round: roundNo, piece: painted.piece || '(image)', secret, sublimeName, trollName, caught: result.caught });

    // REVEAL + SCORE
    this.broadcast({
      t: 'phase', name: 'REVEAL', round: roundNo,
      secret, machineEntryId, machineName: nameOf(machineEntryId),
      sublime: result.sublimeEntry, troll: result.trollEntry, looper: result.looperEntry,
      caught: result.caught, crowns: result.crowns,
      scoreboard: this.scoreboard(),
    });
    await wait(config.nameSeconds > 5 ? 1500 : 100); // brief beat between rounds (short in tests)
  }

  // collect one name per active player; bots & the machine-captain auto-submit; 60s clock
  async collectNames({ secret, captain, piece }) {
    const expected = new Set(this.players.filter((p) => p.connected).map((p) => p.id));
    const got = new Map();
    const startTs = Date.now();
    this._collect = { type: 'name', expected, got, secret, captain, startTs };

    // bots (incl. a bot captain) submit at a random human-like moment
    for (const p of this.players.filter((x) => x.isBot && x.connected)) {
      const delay = Math.min(config.nameSeconds * 1000 - 200, 800 + Math.random() * 4000);
      setTimeout(async () => {
        const n = await llm.botName(piece.piece || 'the work');
        this.submitName(p.id, n);
      }, delay);
    }

    const c = this._collect;
    return new Promise((resolve) => {
      c.resolve = () => {
        if (c.resolved) return; // C14: explicit one-shot — don't rely on _collect===null timing
        c.resolved = true;
        clearTimeout(c.timer);
        const out = [];
        for (const p of this.players) {
          const g = got.get(p.id);
          out.push({ playerId: p.id, isBot: !!p.isBot, name: g ? g.name : '(silent)' });
        }
        if (this._collect === c) this._collect = null;
        resolve(out);
      };
      c.timer = setTimeout(() => c.resolve(), config.nameSeconds * 1000);
    });
  }

  submitName(playerId, raw) {
    const c = this._collect;
    if (!c || c.type !== 'name' || !c.expected.has(playerId) || c.got.has(playerId)) return;
    let name = cleanName(raw);
    // captain bluff rule: a captain may not simply write the secret
    if (c.captain && c.captain.id === playerId && name.toLowerCase() === (c.secret || '').toLowerCase()) {
      name = `${name} (?)`; // nudge it off the literal truth rather than reject outright
    }
    const lock = Math.round((Date.now() - c.startTs) / 1000);
    const p = this.players.find((x) => x.id === playerId);
    if (p) p._lock = lock;
    c.got.set(playerId, { name, lock });
    this._maybeResolve();
  }

  async collectVotes(type, fields) {
    const humans = [...this.humanIds()];
    const expected = new Set(humans);             // only humans vote (only humans can score)
    const got = new Map();                        // voterId -> {field->entryId}
    this._collect = { type, expected, got, fields };

    // bots do NOT vote. If there are no human voters, resolve immediately.
    const c = this._collect;
    return new Promise((resolve) => {
      const done = () => {
        if (c.resolved) return; // C14: explicit one-shot guard
        c.resolved = true;
        clearTimeout(c.timer);
        const out = {}; for (const f of fields) out[f] = {};
        for (const [voter, picks] of got) for (const f of fields) if (picks[f]) out[f][voter] = picks[f];
        if (this._collect === c) this._collect = null;
        resolve(out);
      };
      c.resolve = done;
      if (expected.size === 0) return done();
      c.timer = setTimeout(done, Math.max(8000, (config.nameSeconds / 2) * 1000));
    });
  }

  castVote(voterId, field, entryId) {
    const c = this._collect;
    if (!c || !c.fields || !c.expected.has(voterId) || !c.fields.includes(field)) return;
    const picks = c.got.get(voterId) || {};
    picks[field] = entryId;
    c.got.set(voterId, picks);
    this._maybeResolve(); // resolves once every still-connected human has voted (C3)
  }

  _maybeResolve() {
    const c = this._collect; if (!c || !c.resolve) return;
    if (c.type === 'name') {
      if ([...c.expected].every((id) => c.got.has(id))) c.resolve();
      return;
    }
    // vote phases (crown/flag): resolve when all remaining humans supplied all fields,
    // or when nobody is left to wait on (e.g. the last human disconnected) — C3
    if (c.expected.size === 0) return c.resolve();
    const complete = [...c.expected].every((v) => {
      const pk = c.got.get(v); return pk && c.fields.every((f) => pk[f]);
    });
    if (complete) c.resolve();
  }

  scoreboard() {
    return [...this.players]
      .sort((a, b) => b.score - a.score)
      .map((p) => ({ id: p.id, name: p.name, score: p.score, onFire: !!p.onFire, isBot: !!p.isBot }));
  }

  async finale() {
    if (this.ended) return;
    this.ended = true;
    const board = this.scoreboard();

    // --- the rated ladder (walled garden: only paid, logged-in humans are rated) ---
    let ratings = null;
    try {
      if (config.ratings.enabled) {
        const eligible = this.players.filter((p) => !p.isBot && p.sub && p.paid);
        if (eligible.length >= 2) {
          const cur = [];
          for (const p of eligible) {
            const r = await this.store.getRating(p.sub);
            cur.push({ _p: p, sub: p.sub, rating: r ? r.rating : config.ratings.start, games: r ? r.games : 0, gameScore: p.score });
          }
          const updates = elo.updateGroup(cur.map(({ _p, ...e }) => e), config.ratings);
          await this.store.applyRatings(updates);
          const bySub = new Map(updates.map((u) => [u.sub, u]));
          // public shape only — id/name/deltas, never the opaque `sub`
          ratings = cur.map(({ _p, sub }) => {
            const u = bySub.get(sub);
            return { id: _p.id, name: _p.name, before: u.before, after: u.after, delta: u.delta, provisional: u.provisional };
          }).sort((a, b) => b.after - a.after);
        }
      }
    } catch { /* ratings are best-effort; a rating bug must never break the finale */ }

    // build the show summary for the docent (a record of what the HUMANS decided)
    const summary = {
      rounds: this.history.length,
      winner: board[0] ? { name: board[0].name, score: board[0].score } : null,
      sublime: this.history.map((h) => h.sublimeName).filter(Boolean),
      troll: this.history.map((h) => h.trollName).filter(Boolean),
      caughtCount: this.history.filter((h) => h.caught).length,
      onFire: board.filter((p) => p.onFire).map((p) => p.name),
      bots: this.players.some((p) => p.isBot),
    };
    let review = '';
    try { review = await llm.reviewShow(summary); } catch { /* review is best-effort */ }

    // persist: anonymous works (unlinked) + leaderboard scores (humans only) + the closing review
    try {
      for (const h of this.history) {
        await this.store.addWork({ piece: h.piece, secret: h.secret, sublimeName: h.sublimeName, caught: h.caught });
      }
      for (const p of this.players.filter((x) => !x.isBot)) {
        await this.store.addScore({ handle: p.name, score: p.score, sub: p.sub || null });
      }
      if (review && this.store.addReview) {
        await this.store.addReview({ review, winner: summary.winner, rounds: summary.rounds, caughtCount: summary.caughtCount });
      }
    } catch { /* persistence is best-effort */ }

    this.broadcast({
      t: 'phase', name: 'FINALE', code: this.code,
      scoreboard: board, works: this.history, review,
      winner: board[0] || null, ratings,
    });
  }
}

function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } }

export default Room;
