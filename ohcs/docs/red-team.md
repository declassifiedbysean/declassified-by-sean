# Red Team — Only Humans Can Score
### Attacking my own build, on the record. Verified against source, not speculated.

**Scope:** the production server codebase and the legal/compliance claims I made for it (privacy
notice, blueprint §6, README "privacy law," the content-firewall and POD/IP assertions).
**Method:** read the source, confirmed each finding at file:line. Severity: CRITICAL / HIGH / MEDIUM / LOW.
**Not in scope:** Sean's federal litigation — that's a separate exercise (offered at the end).

The one-line headline: **the claim I repeated most — "anonymous corpus, keep it forever" — is the
weakest thing in the whole build.** The load-bearing wall is the one most likely to fail inspection.

---

## Patch status (this session)

**Fixed and verified** (`npm test` covers them): **C1** prod boot guard for a weak `JWT_SECRET` ·
**C2** host/member-only room start, enforced server-side · **C3** votes resolve the instant a mid-vote
disconnect is removed (no more stalling to timeout) · **C4** `AbortController` timeouts on the image and
LLM calls so a hung provider can't freeze a room · **C11** OAuth `state` is now single-use + TTL-bounded
+ swept (extracted to `auth/oauthState.js`; abandoned logins no longer leak memory or stay valid forever) ·
**C14** the collection resolvers carry an explicit `resolved` one-shot flag (no longer "safe only by luck").

**Still open:** C5–C10, C12, C13 (moderation depth, corpus PII scrub, reconnection, code enumeration, HTTP
rate limit, token-in-fragment, firewall hard-enforcement, scale) and **all of Part 2** — the legal findings
need counsel and, for L1 (age gate) and L2 (real anonymization), design work.

---

## PART 1 — THE CODE

### HIGH

**C1 · Forgeable sessions if deployed without a secret.** `config.js:12` —
`jwtSecret: process.env.JWT_SECRET || 'dev-insecure-secret-change-me'`. There is no boot guard. Ship to
prod with `JWT_SECRET` unset and the fallback signs every token, so anyone can forge a JWT for any
`sub` — full account takeover and leaderboard/identity spoofing.
*Fix:* refuse to start in production unless `JWT_SECRET` is set and long; never fall back silently.

**C2 · Anyone can start anyone's room.** `wsServer.js:58` → `rm.startRoom(msg.code)`. No check that the
caller is the host or even a member. Any authenticated user who knows (or enumerates) a 4-letter code can
force-start someone's private room, including before friends arrive. The host-only button is enforced
**only on the client** — the classic client-side-auth hole.
*Fix:* record the host on the room; verify `caller === host` (or at least a seated member) in `startRoom`.

### MEDIUM

**C3 · A disconnect during voting stalls the room to full timeout.** `Room.js:216` — `_maybeResolve()`
only advances when `c.type === 'name'`. `removePlayer` (Room.js:31) calls it for every phase, but during
CROWN/FLAG it no-ops, so a player dropping mid-vote shrinks `expected` without ever re-checking
completeness. The round then waits out the entire vote timeout (~8s) every time, instead of resolving once
the remaining humans have voted.
*Fix:* have `_maybeResolve` (and `castVote`) re-evaluate vote completeness; resolve when all *still-connected*
humans have supplied all fields.

**C4 · A hung provider freezes the game forever.** `imagegen.js:42` and `llm.js:25` `await fetch(...)` with
no `AbortController`/timeout. The offline fallback only triggers on a *thrown* error — a provider that
accepts the connection and then hangs blocks the round indefinitely. One slow paint stalls every player.
*Fix:* wrap both fetches in an `AbortController` with a few-second timeout; treat timeout as "fall back."

**C5 · Moderation is a fig leaf for a stranger product.** `filter.js` — a small slur regex defeated by
spacing, leetspeak, or unicode homoglyphs, and `report()` merely `console.log`s with no queue, ban, or
takedown. For strangers + generated content this is not a floor, it's a decoration.
*Fix:* real moderation service for text + images, an actual report→review→action pipeline, and persistence
of reports. This gates opening to strangers at all.

**C6 · The "anonymous" corpus can swallow PII through free text.** `Room.js` → `memoryStore.addWork`
stores `sublimeName` (a human-typed title), and `addScore` stores the chosen handle. Players type whatever
they want — including their own or others' real names. So the corpus I call "anonymous" can ingest personal
data at the source. (This is also Legal finding L2.)
*Fix:* scrub/clean free-text before it enters the kept corpus; treat names as potentially-personal until proven otherwise.

**C7 · No reconnection.** A dropped player can't rejoin an in-progress game; their token reconnects but the
loop never re-seats them. Strangers on phones drop constantly. A party game without resume bleeds tables.
*Fix:* room-rejoin by token within a grace window; hold the seat.

### LOW / LOW-MEDIUM

- **C8 · Private rooms are enumerable.** 4-char codes (~1M space), join-by-code gated only by a 40/min ws
  limiter and no per-join cap → slow brute-force/griefing is feasible. *Fix:* per-IP join-attempt limits; longer codes for sensitive rooms.
- **C9 · No HTTP-layer rate limiting.** Only the ws path is throttled; `/auth/guest` and `/api/*` are
  spammable (DoS, unbounded guest minting). *Fix:* express rate-limit middleware.
- **C10 · OAuth token in URL fragment.** `index.js` callback redirects to `/#token=…`. Out of server logs
  (good) but lands in browser history; a 30-day token raises theft value. *Fix:* short-lived one-time code exchanged for the session; shorter token TTL + refresh.
- **C11 · OAuth `state` never expires and is never garbage-collected** unless the callback succeeds
  (`index.js:33`). Stale state is valid forever; abandoned logins leak memory. *Fix:* TTL + periodic sweep.
- **C12 · The no-famous firewall is prompt-instructed, not enforced.** `imagegen.js` `firewallViolation`
  only catches a few porn regexes; "no real/famous person" rides entirely on the model following the prompt.
  Drift (or any future user-influenced secret) could paint a real person. (Also Legal L3.) *Fix:* a real classifier/denylist pass on secrets and outputs.
- **C13 · Single-process, in-memory.** A crash or restart loses every live game and (with the default store)
  all data; no horizontal scale. Acknowledged as README gap #6 — restating because it's a real availability risk.
- **C14 · Double-resolve is safe only by luck.** The collection resolvers are idempotent *only because*
  `Promise.resolve` ignores second calls; there's no explicit guard. A future refactor that does side-effects
  in the resolver would introduce a double-fire bug. *Fix:* a `resolved` flag.

**Honest doc/impl mismatch (not a bug):** the blueprint promised "reassign the Captain if it drops." The
implementation made the Captain non-load-bearing — the *server* chooses the secret — so a dropped Captain
is harmless and no reassignment is needed. The blueprint over-specified. Fix the blueprint, not the code.

---

## PART 2 — THE LEGAL / COMPLIANCE CLAIMS

I am not a lawyer; this is design-level risk, not legal advice. But these are the claims *I* made, and
several are weaker than I stated.

### CRITICAL

**L1 · No age gate. COPPA / minors exposure.** A stranger lobby with user-generated names and AI image
generation, and **zero age verification anywhere in the build**. Consumer party games attract minors;
COPPA (US, under 13) and GDPR (under 13–16 by member state) impose hard duties — parental consent, data
limits, and heightened safety. A stranger-matched minor + generated images + weak moderation (C5) is the
single most serious exposure in the product, and I never raised it. *This gates launch.* *Fix:* age gate,
age-appropriate-design review, and a hard child-safety pass before any stranger mode ships.

### HIGH

**L2 · "Anonymous corpus, out of scope, keep it forever" is overclaimed — and it's my most-repeated claim.**
Omitting an `account_id` is *not* anonymization. Under GDPR Recital 26 / WP29 Opinion 05/2014, data is
anonymous only if singling-out, linkability, and inference are all defeated by means reasonably likely to be
used. Two live linkage vectors remain: (a) **temporal co-occurrence** — works and a leaderboard entry from
the same game share a date/session and can be re-linked; (b) **free-text PII** (C6). So the corpus is most
likely **pseudonymous**, which carries full data-subject rights and retention limits — not "keep forever."
CCPA/CPRA "deidentified" similarly requires technical safeguards + a no-reidentification commitment, not just
a missing key. *Fix:* real methodology — aggregate, k-anonymize, scrub free text, coarsen/strip timestamps,
and document it — or reclassify the corpus as pseudonymous and apply rights/retention accordingly.

**L3 · AI art is (in the US) not copyrightable — which undercuts the POD "sell the works" flywheel.**
Per the Copyright Office's 2023 guidance and *Thaler v. Perlmutter*, a purely machine-generated image has no
human author and no copyright. Consequences I asserted past: you likely **cannot own or stop copying** of the
prints you'd sell; the "reverse-NFT factory" rests on assets you may not control; and several POD platforms
restrict or forbid AI-generated art outright. Only the human-authored bits (the player's *name*, perhaps the
prompt) carry thin protection. *Fix:* don't build a revenue claim on owning the images; if POD proceeds, design
around uncopyrightable output (sell the human-authored layer, the experience, or licensed printing) and check
each platform's AI terms.

### MEDIUM

**L4 · The no-faces firewall "protects right of publicity / biometric / deepfake" — overstated.** It's
prompt-instructed not enforced (C12); publicity and likeness rights attach to **names and recognizable
attributes**, not just faces; and user-typed *names* can name real people (publicity/defamation via text).
The protection is weaker than the doc claims.

**L5 · International transfers unaddressed.** US-hosted server + EU players + Google as a processor = a
cross-border transfer needing SCCs/adequacy analysis. "GDPR-ready" framing omits the transfer mechanics.

**L6 · No consent mechanism, no RoPA, no processor DPAs.** Google, the image provider, and the LLM provider
are sub-processors that need data-processing agreements; the cookie/consent posture is asserted without a
consent-management tool; lawful basis is left "TBD." Endpoints for export/delete exist, but the surrounding
program (records of processing, consent capture, DPAs) does not.

### LOW

- **L7 · "Store only the opaque `sub` = minimal" is true but `sub` + the `given_name` handle are still fully
  in-scope personal data.** "Minimal" ≠ "not personal." Could go further: request `openid` only and let the
  user type a handle, instead of pulling `profile`.
- **L8 · "Guest = no identity kept" slightly overclaims.** IP and connection metadata are still processed
  (logs, rate-limit buckets), and a guest's chosen handle persists on the public leaderboard. Reconcile the copy.
- **L9 · Confidence mismatch across docs.** The privacy notice carries a "not legal advice / needs counsel"
  caveat; the README and blueprint make stronger compliance claims without it. Align the confidence.

---

## What the red team actually changed my mind about

1. The privacy story sold the game and it's the softest claim. "Unlinked" is necessary, not sufficient —
   timestamps and free text re-link. **Either do real anonymization with a documented method, or stop saying
   "forever."**
2. **The business model has an IP hole** I waved past: you probably can't own the art you planned to sell.
3. **I shipped a consumer product with no age gate** and called the moderation a "floor" when it's a decoration.
   For strangers, those two together are the gate to launch, not a later polish.
4. Several code holes are the cheap kind that are embarrassing in an audit and quick to fix (C1–C4).

The honest read: the engineering is in better shape than the claims. The code has a handful of fast,
verifiable fixes; the *legal posture* needs real counsel and, in two places (L1 age, L2 anonymization),
needs design changes before any of the confident language is true.

**Only Humans Can Score** — including scoring my own homework.
