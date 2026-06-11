// src/game/scoring.js — the four crowns. The middle is the only loss.
// LAW: only humans cast the votes that confer worth. The machine never tallies. Enforced by
// only counting votes from human players (bots and the machine entry do not vote).

const BASE = { sublime: 100, troll: 100, flag: 75, looper: 60 };

// entries: [{ id, name, byPlayerId, isMachine, isBot }]
// votes:  { sublime: {voterId->entryId}, troll: {voterId->entryId}, flag: {voterId->entryId} }
// humans: Set of human player ids (the only valid voters)
// machineEntryId: the canonical machine guess everyone hunts
export function tallyRound({ entries, votes, humans, machineEntryId, players, lockSeconds }) {
  const count = (vmap) => {
    const tally = {};
    for (const [voter, entryId] of Object.entries(vmap || {})) {
      if (!humans.has(voter)) continue;       // <-- only humans can score
      tally[entryId] = (tally[entryId] || 0) + 1;
    }
    return tally;
  };
  const winnerOf = (tally) => {
    let best = null, bestN = -1;
    for (const [id, n] of Object.entries(tally)) if (n > bestN) { best = id; bestN = n; }
    return bestN > 0 ? best : null;
  };

  const sublimeTally = count(votes.sublime);
  const trollTally = count(votes.troll);
  const flagTally = count(votes.flag);

  const sublimeEntry = winnerOf(sublimeTally);
  const trollEntry = winnerOf(trollTally);

  // The Flag: a human who pointed at the true machine entry catches it.
  const flaggers = Object.entries(votes.flag || {})
    .filter(([voter, entryId]) => humans.has(voter) && entryId === machineEntryId)
    .map(([voter]) => voter);
  const caught = flaggers.length > 0;

  // The Imposter: the human entry most often mistaken FOR the machine (most flag votes landing on
  // a human-authored entry). Only meaningful at 4+ seats.
  let looperEntry = null, looperN = 0;
  for (const [id, n] of Object.entries(flagTally)) {
    const e = entries.find((x) => x.id === id);
    if (e && !e.isMachine && n > looperN) { looperEntry = id; looperN = n; }
  }

  const crowns = {}; // playerId -> [crownName...]
  const award = (pid, crown) => { if (!pid) return; (crowns[pid] ||= []).push(crown); };

  const entryAuthor = (entryId) => entries.find((e) => e.id === entryId)?.byPlayerId || null;

  award(entryAuthor(sublimeEntry), 'sublime');
  award(entryAuthor(trollEntry), 'troll');
  for (const f of flaggers) award(f, 'flag');
  if (players.length >= 4 && looperN > 0) award(entryAuthor(looperEntry), 'looper');

  // points: base x effective heat multiplier (multiplier already resolved per player upstream)
  const round = {}; // playerId -> points this round
  for (const [pid, list] of Object.entries(crowns)) {
    const mult = players.find((p) => p.id === pid)?._mult || 1;
    round[pid] = list.reduce((sum, c) => sum + BASE[c] * mult, 0);
  }

  return {
    crowns, points: round, caught,
    sublimeEntry, trollEntry, looperEntry,
    machineFlaggedBy: flaggers,
  };
}

export const CROWN_BASE = BASE;
export default { tallyRound, CROWN_BASE };
