# Only Humans Can Score — server

A humane real-time multiplayer party game. The machine **paints** a secret as a clue and **guesses**
against the table; **only humans score** — humans alone cast the votes that confer worth. This repo is
the production server the artifact prototype could never be: authoritative game state, a lobby with
"storm & batch" matchmaking, Google login (optional), host-pays image generation, and an anonymous,
unlinked works corpus.

> It runs with **zero configuration and zero secrets** — guest play, a built-in house deck for the
> machine's brain, and honest offline "paintings." Add API keys and a Google client to light it up.

```bash
npm install
npm start            # http://localhost:3000
npm test             # boots the server and plays one full game end-to-end (SMOKE: PASS)
```

---

## What's in the box

| Area | File(s) | What it does |
|---|---|---|
| Entry | `src/index.js` | HTTP (auth, leaderboard, works, data-rights, health) + WebSocket + static client |
| Config | `src/config.js` | every knob; safe defaults; `.env.example` documents them |
| Real-time | `src/realtime/wsServer.js` | the WebSocket router: auth → queue/room → game actions |
| Matchmaking | `src/matchmaking/Batcher.js`, `RoomManager.js` | the storm (queue), the batcher, private code rooms, **bot-backfill** |
| Game engine | `src/game/Room.js`, `phases via Room`, `scoring.js`, `heat.js` | the authoritative phase machine, four crowns, NBA-Jam heat |
| The machine | `src/services/llm.js`, `imagegen.js` | paints, guesses, voices bots — **never judges**; content firewall lives here |
| Storage | `src/store/memoryStore.js`, `README-postgres.md` | accounts, leaderboard, and the **unlinked** works corpus |
| Auth | `src/auth/google.js`, `session.js` | Google OIDC (optional) + guest sessions |
| Moderation | `src/moderation/filter.js` | name filter, rate limit, report sink |
| Client | `public/index.html`, `app.js`, `style.css` | the networked museum-aesthetic front end |
| Test | `test/smoke.js` | end-to-end proof the stack boots and plays |

---

## The core loop (what the lobby forced)

Strangers can't pass a phone, so play is **simultaneous and server-authoritative**. The server owns the
truth and runs every clock:

```
ROUND_START → PAINT → NAME → SEAL → CROWN → FLAG → REVEAL/SCORE → (loop) → FINALE
```

- The **secret** reaches exactly one client — the rotating **Captain** — and never the others until REVEAL.
- Everyone **names** at once against one 60s clock; no one sees another's name before SEAL.
- The machine's **guess** is injected server-side at SEAL, indistinguishable on the wire.
- **CROWN** and **FLAG** votes are counted **only from humans**. The machine paints, guesses, and bluffs;
  it never tallies. "Only humans can score" is enforced in `scoring.js`, not on the honor system.
- Rounds auto-derive as **players + 3** (also the per-game image-cost cap).

### The four crowns
**Sublime** (best name) · **Troll** (worst name) — best and worst both win, the middle is the only loss ·
**the Flag** (caught the machine) · **the Imposter** (the human most mistaken *for* the machine; 4+ seats).

### Heat (NBA Jam, capped ×3)
Lock in the first 20s = Lightning ×3, 20–40s = ×2, after = ×1. Three straight Lightning locks → **ON FIRE**
(pinned ×3); win ≥1 crown to stay lit; a crownless round cools you. Persistence, not bigger numbers.

---

## The lobby: "storm & batch"

Players who want strangers enter the **storm** (a global queue). The **batcher** forms tables:

1. greedily forms full tables of `TABLE_TARGET`;
2. for anyone who has waited `QUEUE_WAIT_MS`, it **resolves them rather than strand them** — launching a
   smaller valid table (≥ `TABLE_MIN`), or applying `WAIT_FALLBACK`.

**No friends online?** `BOT_BACKFILL` fills empty seats with machine players *wearing human masks*, so a
lone human always gets a full game — the no-friends problem turned into a feature, in a Turing game.

**Two doors, one engine:** private **rooms by code** (share a 4-letter code) are the simple social door and
the recommended first thing to ship; matchmaking is just an automatic way to fill the same room.

---

## Google login (optional) + the privacy law

Login is **opt-in**. Guests play with no identity kept — the privacy-clean default. Google buys persistence
(your Vault, a place on the board).

- We request the **minimum** scope (`openid` + `profile` for a display name). **No email** unless a feature needs it.
- We store **only the opaque Google `sub`**. Nothing else by default.

**The one rule that holds the whole posture together** (`store/README-postgres.md`): the **works corpus is
never joinable to accounts** — no `account_id` column on `works`. That keeps the corpus *anonymous and out of
scope* (kept forever) while accounts carry full GDPR/CCPA weight. Account export and erasure are implemented
(`/api/account/export`, `/api/account/delete`); erasure removes the person and leaves the unlinked corpus intact.

To enable real Google login: create an OAuth 2.0 Client in Google Cloud Console, set the authorized redirect
to your `GOOGLE_REDIRECT_URI`, and fill `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.

---

## Services (host-pays) — and honest fallbacks

- **Image generation** (`imagegen.js`): with `IMAGE_API_KEY`, paints the secret as a clue (an OpenAI Images
  provider is wired; the interface is one method, swap freely). The **content firewall** — no faces, no
  famous, no porn — is enforced in the prompt and a pre-check, refusing before a token is spent. No key →
  honest text "paintings" so the loop still runs.
- **The machine's brain** (`llm.js`): with `LLM_API_KEY`, an Anthropic provider chooses secrets and names
  with conviction. No key → a built-in house deck (seeded with depersonalized objects/ideas).

### The last-game review (docent wall-text)
At the close, the machine writes a short review of the show — but it **reports**, it does not judge. It records
what the *humans* decided (who they crowned Sublime, what they sent to the Troll, whether it was caught or
walked free), in the voice of a gallery docent writing the placard as the lights come down. It confers no
worth, because **only humans can score**. The review is broadcast in the FINALE, shown beside the standings,
persisted anonymously, and served at `/api/reviews` to pair with the leaderboard. No key → deterministic
reportage assembled from the game's record. The prompt lives in `llm.js` (`REVIEW_SYSTEM`).

The dominant variable cost is image generation, capped by `players + 3` rounds. Caching painted clues is the
real cost lever.

---

## Deploy notes

- Stateless except the store; run behind TLS (use `wss://`). The client auto-selects `ws`/`wss`.
- Swap `memoryStore.js` for the Postgres schema in `store/README-postgres.md` to persist for real.
- Put the image-gen and LLM keys in the server environment only — they never touch a client.
- Add a real moderation queue behind `moderation/filter.js`'s `report()` sink before opening to strangers.

---

## Open decisions — the gaps, marked (PRIME DIRECTIVE)

These are **resolved enough to run**, but a real design pass should confirm them. They are not hidden:

1. **Wait-time fallback** — set to `bots` (machine masks). Alternatives: `small`, `solo`.
2. **Bot-backfill vs. the Flag crown** — bots are extra named entries; the canonical machine **guess** is the
   single Flag target. This keeps "catch the machine" crisp even at a bot-filled table. Confirm the feel.
3. **Guest vs. forced login** — shipped guest-first. Confirm.
4. **Table size / Imposter** — Imposter needs 4+ seats; `TABLE_TARGET=4` by default.
5. **Moderation depth** — name filter + report + rate limit is the floor; strangers may need active review.
6. **Real-time scale** — single-process in-memory rooms; for scale, move rooms to a room framework
   (Colyseus / PartyKit) or shard with a shared bus. The `bus` abstraction in `RoomManager` is the seam.
7. **Title clearance** — "Only Humans Can Score" is not formally cleared. Independent of this build.

---

*The studio makes without limit; the gallery shows with discipline. This is a thing the studio made.
Whether and when it ships is a Strategic-Pause decision — made deliberately, not on a good evening's momentum.*

**Only Humans Can Score.**
