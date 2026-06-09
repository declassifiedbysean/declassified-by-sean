# The Rated Ladder — Elo blueprint

*Paid tier only. Parked until the Pass is real. This is the ELO Metric made literal: a rating earned slowly, moving only in rated games, climbing by grinding and falling by blundering, always measured against opponents and never in the absolute.*

## The wall — why ratings are paid-tier

Free play is anonymous by design: no account, no identity kept, nothing stored that points back to a person. **You cannot rate a player who keeps no identity** — so the rated ladder is not a feature withheld from free players, it is a feature that is *structurally impossible* there. A rating needs a durable identity to attach to, and the only durable identity in this product is the logged-in Pass holder.

So the gate is two conditions, both required:

1. **Logged in** — the player has an opaque `sub` (the Google subject id; nothing else is kept).
2. **Paid** — the player holds an active Pass (`auth/entitlement.js`).

`auth/entitlement.js` returns `false` for everyone until a real subscription source exists, and `config.ratings.enabled` is `false` by default. **Nothing is rated until the Pass is real.** Turning ratings on without an entitlement source would be the bug, not the feature.

## What counts as a rated game

A finished game is rated only if `config.ratings.enabled` and **two or more** eligible (logged-in + paid) humans played it. Guests, bots, and the machine are never rated and never affect a rating. A room with one paid player and a table of guests produces no rating change — there is no one to rate them against.

## The math (`game/elo.js`, pure, no I/O)

The game is an N-player party game, so we use the standard **pairwise generalization** of Elo:

- **Expectation.** For players A and B, the probability A outscores B is `1 / (1 + 10^((Rb − Ra)/400))` — the Elo convention where a 400-point gap is ~10:1 odds.
- **Outcome.** Final game score decides each pairing: 1 for the higher score, 0 for the lower, 0.5 for a tie.
- **Update.** For each rated player *i*, sum the actual outcomes `S` and expectations `E` against every other rated player, then `Δ_i = round( K · (S − E) / (N − 1) )`. Dividing by `N − 1` averages the per-opponent deltas so a nine-seat table doesn't swing ratings nine times harder than a heads-up one.
- **K-factor.** Provisional players (`games < 10`) move at `K = 40`; settled players at `K = 24`. New ratings find their level fast, then stabilize.
- **Floor.** A rating cannot fall below 100. The floor can clamp a loss; the reported delta is always the *applied* change.

With equal K across a group, a round is **zero-sum up to rounding and the floor** — points moved between players, not minted.

### Verified properties (`test/elo.test.js`, 10/10 passing)

- Equal ratings ⇒ 50% expectation; expectation is symmetric (adds to 1).
- Two equal players: winner `+12`, loser `−12`, sum zero.
- An underdog win pays more than an even-match win.
- Provisional players swing harder (`K=40`) than settled ones (`K=24`) in the same game.
- A rating never falls through the floor.
- A single rated player is a no-op — you cannot rate against no one.
- A five-seat equal-rating table's deltas sum to ~0 (zero-sum up to rounding).

## Persistence (`store/memoryStore.js`)

A rating lives **on the account** (`{ rating, games }`), which is personal data with full rights — so it is included in `account/export` and removed by `account/delete` for free, because it was never a separate linked record. It is never attached to the anonymous works corpus (the privacy law: content, not people).

- `getRating(sub)` · `applyRatings(updates)` · `topRatings(n)` (the ladder leaderboard).
- Postgres parity is a straight port of these three (see `store/README-postgres.md`).

## Surfaces

- **Lobby badge** — a Pass holder sees their rating (`⚜ 1500`, flagged *provisional* under 10 games); a free player sees *unrated — the rated ladder is a Pass feature*.
- **Finale** — rated games show each player's delta and new rating (`+18 → 1518`); the broadcast carries only public id/name/delta, **never the `sub`**.
- **API** — `GET /api/leaderboard?type=rating` (the ladder), `GET /api/ratings/me` (your own, login required).

## Open decisions (for counsel / the council, before the Pass ships)

- **Decay.** Should idle ratings decay, or stand? (Currently: stand.)
- **Seasons.** One eternal ladder, or seasonal resets with a hall of fame? (Currently: eternal.)
- **Visibility.** Is the ladder public, Pass-only, or opt-in? (Currently: the endpoint is public; revisit with privacy counsel — a rating plus a handle is more identifying than an anonymous score.)
- **Tie-breaking and team play** if room formats expand beyond free-for-all.

Until those are decided and a processor exists, the ladder stays exactly here: built, tested, and behind the wall.
