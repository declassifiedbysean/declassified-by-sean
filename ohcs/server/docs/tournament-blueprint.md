# Tournament Blueprint — The Duel & the 32-Bracket (PARKED)

*Working spec, June 7 2026. Paid-tier, server-side. Built as a blueprint and parked behind the entitlement wall like the Elo ladder — not shippable until the realtime `server/` tier is live. Not legal advice; the trophy/eligibility side needs counsel (see §7).*

---

## 0. What this is, in one line
A 32-seat, single-elimination, **1v1** tournament for Pass holders. Seeds are set by **Elo rating** (the ladder you already built). Winner gets a real trophy. The match is the **inverse of the core game** — and "only humans can score" still holds.

---

## 1. The duel — the inverted loop

The core game: the **machine paints**, humans **name**. The duel flips it.

> **Both human players are given the same secret. Each writes a *clue* the machine renders into a picture. The AI — the persistent third player — then tries to *guess the secret* from each rendered picture. The human whose picture made the secret most legible to the machine wins the round.**

Why this is the right shape:
- **It's a true 3-player match every time:** human, human, and the machine as a *constant* opponent. The machine is identical in every match across the whole bracket, so it's a fair, fixed measuring stick — no seeding distortion from "who drew the machine."
- **"Only humans can score" holds.** The two humans are the only ones who bank points and advance. The AI doesn't score — it *measures*. It's the instrument, not the contestant. (This is the same doctrine as the main game, applied cleanly to a 1v1.)
- **It reuses the engine you have**, inverted: clue → render → machine-guess is the existing pipeline run backwards. No new art model, no new game vocabulary.
- **It stays inside the locked-down architecture.** Players submit **text clues the machine renders** — never image uploads. This keeps the no-upload, anonymous-by-design posture from the privacy/AUP/security work intact: no user image surface, no §2258A upload burden, `connect-src 'self'` unbroken. *(This was a deliberate decision — image upload was considered and rejected on safety grounds.)*

### 1.1 Scoring one duel
Best-of-N rounds (recommend **best of 3**, configurable). Each round:
1. Both players get the same secret (drawn from the same pool the main game uses).
2. Each writes a clue (timed; Relaxed-mode accessibility accommodation still available — no speed penalty path).
3. The machine renders each clue to a picture.
4. The machine attempts to name/guess the secret from each picture, returning a **confidence/closeness score** per picture (e.g., semantic distance between guess and secret, normalized 0–1).
5. **Higher closeness wins the round.** Ties broken by submission speed (unless both players are in Relaxed mode, then by a coin the server logs).
6. First to ⌈N/2⌉ round wins takes the match and advances.

**Anti-degeneracy guards (the honest catches):**
- *The "just write the secret" exploit:* a clue that literally contains the secret word would trivially max the machine's guess. Guard: clues are screened for the secret token (and close stems) before rendering; a flagged clue is rejected with "too on-the-nose — paint it, don't name it." This keeps it a *skill* of visual communication, not a copy-paste.
- *Prompt-injection of the renderer/guesser:* clues are user input flowing into model calls — sanitize/escape, treat as untrusted, never let a clue alter system instructions. (Carries the red-team discipline into the duel.)
- *AUP applies in full:* the clue box is a submission box. Same prohibited-content rules, same enforcement.

---

## 2. Seeding by Elo

Entry is a Pass-gated opt-in for a given tournament. At lock time:
- Pull each entrant's rating via `store.getRating(sub)`; unrated/provisional entrants seed at `DEFAULTS.start` (1500) with a provisional flag.
- **Sort entrants by rating, descending → that order is the seed list (1 = highest).**
- Standard bracket placement so top seeds are maximally separated (1 vs 32, 2 vs 31, … in the classic March-Madness fold, where seed *k* meets seed *33−k* in round 1, and the bracket halves/quarters keep 1 and 2 apart until the final).

This reuses the ladder directly — **no new rating system**. The duel just *consumes* Elo for seeding. Whether duel results also *feed* Elo is a §6 open decision.

---

## 3. The 32-bracket — and partial fields

32 is the target, but real fields won't always be 32. Bye logic:
- Bracket size = next power of two ≥ entrants (8, 16, 32). Cap at 32 per tournament; overflow → waitlist or a second bracket.
- **Byes go to the top seeds.** If field = 25, the top 7 seeds get round-1 byes (32−25), so the strongest players are rewarded and the bracket stays balanced.
- Minimum viable field: recommend **8** (a real bracket; below that it's an exhibition, not a tournament).

Rounds for a 32-bracket: Round of 32 → 16 → 8 (quarters) → 4 (semis) → final. Five rounds, 31 matches.

## 3a. Cadence — the weekly bracket and the breakout

**The weekly bracket runs across the week.** The five rounds spread Monday through the weekday rather than firing as a single daily one-off — one round (or round-pair) advances per day, so a 32-bracket resolves over the working week and players return daily to see their match. This keeps the habit loop (a reason to come back each day) without demanding a whole tournament in one sitting.

- Suggested spread: **Mon** Round of 32 → **Tue** Round of 16 → **Wed** quarters → **Thu** semis → **Fri** final. (Configurable; Relaxed-mode timing accommodations still apply per round.)
- A duel that isn't played within its day's window resolves by the §6 rule (forfeit / auto-advance higher seed — decision flagged below), so one absent player can't stall the bracket.
- Seeding is locked at the start of the week from ladder Elo (§2); the bracket is fixed for that week.

**Breakout tournaments land on select weekends** — not locked to "last weekend of the month." The breakout is the marquee event (the real trophy, §7): a special-weekend bracket announced ahead of time, run as its own self-contained event rather than spread across days. Selecting weekends (rather than a fixed monthly date) avoids the calendar edge cases of "last weekend" drifting between the 28th and the 31st, and lets the cadence flex around real player availability and operator readiness.

- The weekly bracket and a breakout weekend **don't overlap**: in a breakout week, the weekly bracket pauses (or concludes by Thursday) so the weekend event stands alone. Naming this rule up front avoids a Friday-final colliding with a Saturday-breakout.
- Breakout seeding: same Elo seeding (§2) as the weekly, optionally weighted by recent weekly-bracket performance — a season-two upgrade, not v1.

> **Schedule rule, stated to avoid ambiguity:** weekly brackets run Mon–Fri; breakout weekends are announced and pre-empt that week's weekly bracket. No daily duel and breakout ever compete for the same player on the same day.

---

## 4. Persistent state (server-side)

A tournament is durable state — players come and go, matches resolve over time. Shape (store-agnostic; memoryStore now, real DB later):

```
Tournament {
  id, name, status: 'open'|'seeding'|'live'|'complete',
  bracketSize, createdAt, lockAt,
  entrants: [{ sub, handle, rating, provisional, seed }],
  matches: [ Match ],
  championSub, trophyStatus
}
Match {
  id, round, slotHi, slotLo,            // bracket position
  playerA: sub|null, playerB: sub|null, // null = awaiting feeder / bye
  rounds: [{ secret, clueA, clueB, closenessA, closenessB, winner }],
  winnerSub, status: 'pending'|'live'|'done',
  feedsInto: matchId                    // where the winner advances
}
```

Match resolution advances the winner into `feedsInto`'s open slot; when both slots fill, that match goes `live`.

---

## 5. Server surface (new endpoints/handlers — parked)

- `POST /api/tournaments` — create (admin/operator).
- `POST /api/tournaments/:id/enter` — Pass-gated entry (`entitlement.isPaid(sub)` must be true).
- `POST /api/tournaments/:id/lock` — seed by Elo, build bracket, assign byes.
- `GET  /api/tournaments/:id` — bracket state (public-safe: handles + seeds + scores, never `sub`).
- WebSocket duel room — reuses the realtime layer: serves secret, collects clues, calls renderer + guesser, returns closeness, advances.
- `GET /api/tournaments/:id/champion` — winner + trophy claim flow.

All gated behind the **entitlement wall** (`auth/entitlement.js`), same as the rated ladder. Identity is required (you can't ship a trophy to an anonymous player) — and that identity lives on the **account**, covered by export/delete, never on the anonymous free-play corpus. The wall between paid identity and anonymous play (the privacy keystone) is preserved.

---

## 6. Decisions (resolved — v1 defaults; revisit with real player data)
1. **Duel results vs Elo — RESOLVED: separate.** Ladder Elo *seeds* the bracket but duel/tournament results do **not** feed back into ladder Elo. Track a separate **tournament record** (W-L, rounds reached, breakout wins) so a knockout upset doesn't wreck a ladder rating built on the group game — they're different skills. Ladder Elo stays the seeding input only.
2. **Match length — RESOLVED: Bo3 throughout, Bo5 for the breakout final.** Weekly-bracket rounds and breakout rounds are best-of-3; only the breakout final escalates to best-of-5. Keeps daily rounds quick, gives the marquee final its weight.
3. **Closeness metric — RESOLVED (v1): semantic embedding distance**, normalized 0–1, between the machine's guess and the secret — rewards "close," not just exact match. Requires a pinned embedding model + a documented threshold; pin both at build and version them so scoring is reproducible across a season. (Fallback if embeddings prove flaky in practice: literal guess-match with partial credit for synonyms.)
4. **Relaxed-mode tie-break — RESOLVED: sudden-death extra round**, not a coin. When neither player has a speed signal, play one more round; repeat if still tied. Keeps the decision on skill, never chance — which also keeps the contest-law posture clean (§7).
5. **Forfeit / unplayed-duel rule — RESOLVED:** a duel not played within its day's window auto-advances the **higher seed** (or, if both no-show, the higher seed advances and the result is logged as a double-forfeit). One absent player can't stall the weekly bracket.
6. **Cadence — RESOLVED (see §3a):** weekly 32-bracket Mon–Fri; breakout on select pre-announced weekends; breakout weeks pre-empt the weekly bracket so they never overlap.

*Still genuinely open (need real players or counsel, not a v1 guess):* minimum-field threshold for a "real" breakout vs exhibition; whether breakout seeding should weight recent weekly performance (season-two); the embedding model/threshold specifics; and everything in §7 (trophy/eligibility/contest law).

---

## 7. Trophy & eligibility — the legal spine (NEEDS COUNSEL)
A real physical prize + paid entry + a bracket is, legally, a **contest/promotion**, and the three lottery elements — *consideration* (paid Pass), *prize* (trophy), *chance* — are the thing to keep apart. The defensible posture, consistent with the research memo already in the build:
- **Frame and run it as a game of skill**, not chance — the duel is decided by clue-writing skill measured by the machine, which supports the skill characterization, but *characterization is a counsel determination.*
- **Resolve "no purchase necessary."** If paid entry is required, that's the riskiest element; a free alternate method of entry (AMOE) is the standard mitigation. **Counsel call.**
- **Write official rules:** eligibility (age 18+, jurisdiction limits — some U.S. states and countries restrict prize contests), how a winner is determined, trophy fulfillment, taxes/1099 if value crosses thresholds, dispute terms.
- **Tie into the existing Terms/AUP/Privacy set** — don't bolt on a separate liability.

This section is a **flag, not a finished product.** Do not run a real-trophy tournament without counsel signing the rules.

---

## 8. Build status
- **Spec:** complete (this doc).
- **Code:** none yet — parked. Depends on the realtime `server/` tier, which is itself parked behind the June 13 free launch.
- **Reuses, doesn't rebuild:** Elo engine (`game/elo.js`), entitlement wall (`auth/entitlement.js`), account store (`store/memoryStore.js`), the render→guess pipeline, the AUP/Privacy/security posture.
- **Next when backend goes live:** pick §6 decisions, build the bracket module + duel WS handler, write official rules with counsel.
