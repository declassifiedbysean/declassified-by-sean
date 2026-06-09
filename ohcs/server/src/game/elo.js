// src/game/elo.js — the rated ladder. Pure functions; no I/O, no state.
//
// This is the ELO Metric made literal: a rating is earned slowly, moves only in rated games,
// climbs by grinding and falls by blundering, and is always measured against opponents —
// never in the absolute. Only paid, logged-in humans are rated (see auth/entitlement.js);
// free play is the unrated sandbox and stays anonymous, so there is nothing there to rate.
//
// The game is an N-player party game, so we use the standard pairwise generalization of Elo:
// each rated player is compared against every other rated player by final game score, and the
// per-opponent deltas are averaged so a nine-seat table doesn't swing ratings nine times harder
// than a heads-up one. Equal K across a group makes the round zero-sum up to rounding and the floor.
//
// No imports: the engine is pure and self-contained so it can be tested and reasoned about in
// isolation. Callers pass config (the server passes config.ratings); these are the fallback.
export const DEFAULTS = { start: 1500, kBase: 24, kProvisional: 40, provisionalGames: 10, floor: 100 };

// Probability that A beats B given their ratings. The 400/10 curve is the Elo convention:
// a 400-point gap implies ~10:1 odds.
export function expected(ra, rb) {
  return 1 / (1 + Math.pow(10, (rb - ra) / 400));
}

// Actual head-to-head result from two final game scores: 1 win, 0 loss, 0.5 tie.
export function outcome(scoreA, scoreB) {
  if (scoreA > scoreB) return 1;
  if (scoreA < scoreB) return 0;
  return 0.5;
}

// New players move fast (provisional K) until they have enough games to be trusted, then settle.
export function kFor(games, cfg) {
  const c = cfg || DEFAULTS;
  return games < c.provisionalGames ? c.kProvisional : c.kBase;
}

// Rate one finished game.
//   entries: [{ sub, rating, games, gameScore }]   (one per rated player)
//   returns: [{ sub, before, after, delta, games, provisional }]
// Fewer than two rated players => no-op (you cannot rate a player against no one).
export function updateGroup(entries, cfg) {
  const c = cfg || DEFAULTS;
  const n = entries.length;
  if (n < 2) {
    return entries.map((e) => ({
      sub: e.sub, before: e.rating, after: e.rating, delta: 0,
      games: e.games, provisional: e.games < c.provisionalGames,
    }));
  }
  return entries.map((e) => {
    let S = 0, E = 0;
    for (const o of entries) {
      if (o === e) continue;
      S += outcome(e.gameScore, o.gameScore);
      E += expected(e.rating, o.rating);
    }
    const k = kFor(e.games, c);
    let delta = Math.round((k * (S - E)) / (n - 1));
    let after = Math.max(c.floor, e.rating + delta);
    delta = after - e.rating; // floor can clamp the loss; report the real applied delta
    const games = e.games + 1;
    return { sub: e.sub, before: e.rating, after, delta, games, provisional: games < c.provisionalGames };
  });
}

export default { expected, outcome, kFor, updateGroup };
