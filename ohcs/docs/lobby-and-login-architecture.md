# ONLY HUMANS CAN SCORE — Lobby & Login Architecture
### Production blueprint · the leap off the artifact

**Status:** specification, not built. Behind the Strategic Pause.
**Audience:** the backend dev who builds this (possibly future-Sean).
**Author's note:** This is the honest shape of the thing. Where something can't be hand-waved, it's marked as a gap, not filled with a guess.

---

## 0. The border (read this first)

The single-file HTML game is the **same-room prototype**. Pass-the-device, one screen, no server. It is finished as that.

The lobby is a **different animal**: a real service with a server, a database, a real-time layer, and accounts. It does not live in an artifact, a sandbox, or a single HTML file. The moment you want strangers playing each other dynamically, you have crossed from "a web page" into "a multiplayer backend." That crossing is the entire cost of this document.

Two structural facts that force the crossing:

1. **Strangers in real time require an authoritative server.** Someone has to hold the true game state, match the players, run the clock, and push updates to every device at once. A browser cannot do this for other browsers.
2. **Google login requires a registered origin.** OAuth will not complete from inside a sandbox with no stable, registered redirect URI. It needs a real domain you control.

Neither is hard *because the work is exotic*. They are hard because they are **infrastructure**, and infrastructure is the part the prototype deliberately skipped.

---

## 1. The consequence nobody mentions until it's too late: the core loop changes

The current loop is **pass-the-device**: one secret, one screen, players take turns naming because they physically hand the phone around. Hidden information is protected by *not looking*.

Strangers on their own phones cannot pass a device. The loop becomes **simultaneous and networked**:

- Everyone sees the painted clue at the same time.
- Everyone names at the same time, on their own screen, against one shared clock.
- No one sees anyone else's name until the server reveals them together.
- The machine's guess is injected **server-side**, so no client can detect it by inspecting its own screen or the network traffic.

This is not a downgrade. It is **stronger** than pass-the-device, because the secret never touches a player's device during play and the integrity of "only humans can score" is enforced in the netcode, not on the honor system. But it is a real reflow of every phase. Budget for it as a rewrite of the game loop, not a port.

---

## 2. System architecture (the pieces)

```
                    ┌─────────────────────────────┐
                    │   CLIENT  (the web app)      │
                    │   - lobby UI                 │
                    │   - networked game loop      │
                    │   - renders painted pieces   │
                    └───────────┬─────────────────┘
                                │  WebSocket (real-time)
                                │  + HTTPS (auth, REST)
                    ┌───────────▼─────────────────┐
                    │   GAME SERVER (authoritative) │
                    │   - matchmaker ("storm")      │
                    │   - room/game state machine   │
                    │   - server-run clock          │
                    │   - injects machine guess     │
                    └───┬──────────┬──────────┬────┘
                        │          │          │
          ┌─────────────▼──┐  ┌────▼──────┐  ┌▼──────────────┐
          │  IMAGE-GEN SVC │  │  AUTH     │  │  DATASTORE     │
          │  (paints clue) │  │  Google   │  │  - sessions    │
          │  host-pays     │  │  OIDC     │  │  - accounts    │
          │  content firewall│ │           │  │  - vault/corpus│
          └────────────────┘  └───────────┘  └────────────────┘
```

Six components. The prototype has only one (the client) and fakes a second (image-gen is text-only in-canvas, the marked swap point).

### 2.1 Client
The existing HTML, refactored into a networked client. It stops *owning* game state and starts *receiving* it. It renders what the server tells it and sends the player's actions (name submitted, flag cast). All the visual work — the museum aesthetic, the four crowns, the TI-83 finale, the Vault — survives; the brain moves to the server.

### 2.2 Real-time layer
The pipe that pushes state to every device live. **Do not hand-roll raw WebSocket infrastructure.** Use a room-based framework or managed service. Representative, honest options (a dev should evaluate, not take as gospel):

- **Colyseus** — Node room-based multiplayer game server with built-in matchmaking and authoritative state. Strong fit for exactly this kind of turn-based party game.
- **PartyKit** — room-per-game on Cloudflare Durable Objects. Good fit, edge-distributed.
- **Ably / Liveblocks / Supabase Realtime** — managed pub/sub; you build more of the game logic yourself.

For a turn-based party game with discrete phases, **a room framework (Colyseus / PartyKit) is the closest match** because the unit of the game *is* a room.

### 2.3 Game server (authoritative)
Holds the truth: whose turn to prompt, what the secret is, who has named, what the clock says, when to reveal. Runs the phase machine (§4). Injects the machine guess. Talks to the image-gen service. This is the new center of gravity.

### 2.4 Image-gen service
The existing swap point (`paintSecret` in the prototype). Host-pays, server-side so the API key is never on a client, and **the content firewall lives here** — no faces, no famous, no porn, enforced at the engine, refusing before a single token is spent. Unchanged in principle from the prototype's design; now it actually generates images.

### 2.5 Auth (Google OIDC) — §5.

### 2.6 Datastore
Two kinds of data with two different lifespans and two different privacy postures (§6):
- **Ephemeral:** live lobby/room state. Dies when the game ends.
- **Persistent:** accounts (if login), the all-time leaderboard, the works corpus. The Vault graduates from on-device `window.storage` to a real server-side collection here.

---

## 3. The lobby: "storm and batch" matchmaking

Your phrase, honored. The design that makes a lone player never get stranded.

### 3.1 The storm (the queue)
A player who wants to play strangers joins a **global queue** — the storm. They are not in a game yet; they are waiting to be batched into one.

### 3.2 The batcher (forms tables)
A loop watches the queue and forms rooms. The rules that keep a single player from being stranded:

- **Target table size:** `N` players (e.g., 4 — enough for the Imposter crown to exist).
- **Minimum to launch:** `MIN` (e.g., 3).
- **Max wait:** `T` seconds. When a player has waited `T`, the batcher must resolve them rather than leave them hanging. Resolution options (pick a policy — this is an open decision, §8):
  - Launch with whoever is queued (down to MIN), accept a smaller table.
  - **Backfill with machine "bot" players** so the table fills — turns the no-friends problem into a feature, because the bots are *the machine wearing human masks*, which is thematically perfect for a Turing game. (Strong candidate.)
  - Drop them into **Solo mode** vs. the machine (the buildable-now fallback) and tell them honestly no humans were available.
- **Backfill rule:** a player who joins mid-wait fills an open seat in a forming room before a new room is opened.

### 3.3 Two front doors, not one
Stranger matchmaking is the *hard* social mode. **Private rooms by code** (you make a room, share a 4-letter code, friends join) is far simpler, ships first, and delivers most of the social value. Build the room machinery once; matchmaking is just an *automatic* way to fill a room that private-code play fills manually. Same engine, two doors.

### 3.4 Disconnect handling (do not skip)
Strangers rage-quit, lose signal, close tabs. The room must survive it: if the Captain drops, reassign the role; if a namer drops, score the round without them; if the table falls below MIN, end gracefully and bank the works. A party game that bricks when one stranger leaves is dead on arrival.

---

## 4. Real-time game sync (the phase machine)

The server runs an authoritative state machine. Each phase has a server-owned clock; clients render and submit, the server decides.

```
LOBBY → (batch) → ROUND_START
  ROUND_START   : server picks Captain, sends secret to Captain ONLY
  PAINT         : server calls image-gen, broadcasts the painted clue to all
  NAME          : 60s server clock; each client submits one name; Captain bluffs
  SEAL          : server collects names, injects the machine's guess, shuffles
  CROWN         : clients vote Sublime / Troll; server tallies
  FLAG          : each client guesses which entry is the machine; server tallies
  REVEAL        : server unmasks — the secret, the machine entry, the crowns
  SCORE         : server applies base × heat, updates room totals
  → next ROUND_START until rounds = players + 2
FINALE          : server writes works + scores to the persistent Vault
```

**Integrity guarantees the server enforces (and the prototype could only ask for politely):**
- The secret reaches exactly one client (the Captain) and never the others until REVEAL.
- No player sees another's name before SEAL.
- The machine's guess is added server-side during SEAL, indistinguishable on the wire.
- **Only humans can score.** The machine paints, guesses, and bluffs; it never tallies a crown. This is enforced in code on the server — Reception, written into the netcode.

---

## 5. Google login (OAuth / OIDC)

### 5.1 The flow
Standard OpenID Connect. Client redirects to Google → user consents → Google redirects back to **your registered redirect URI** with a code → your server exchanges the code for an ID token → you verify it → you issue your own session (a signed cookie or JWT). Google never sees your game; you never see Google's password.

### 5.2 What to request and what to keep — minimize hard
- **Request:** the `openid` scope, and `profile` only if you genuinely need a display name. Do **not** request email, contacts, or anything else unless a feature requires it. Every scope is a liability.
- **Store:** the opaque `sub` (Google's stable user ID) as the account key. A self-chosen display handle for the leaderboard. **Nothing else by default.** Not the email, not the real name, unless a named feature needs it and the privacy notice covers it.

### 5.3 Don't force it — guests play free
**Login should be optional.** Let anyone play as a guest with a chosen handle. Login is the upgrade that buys persistence: your Vault follows you, your name holds a place on the all-time board, your weekly-winner prize can ship. Forcing Google at the door adds friction *and* identity for players who wanted neither. Guest-first is better for adoption and for privacy at the same time.

---

## 6. The privacy refit (login changes the posture — eyes open)

This is the cost the excitement hides. The prototype and the privacy notice were built around a haven: **anonymous data is out of scope, keep it forever, sleep at night.** Accounts break that haven on purpose, because an account *is* identity.

The reconciliation that lets you have both:

| Data | Posture | Rule |
|---|---|---|
| **Account data** (Google `sub`, handle, session) | **Personal data.** Full GDPR/CCPA. | Minimize. Opaque ID only. Honor access/export/delete. Let accounts be deleted. |
| **Live room state** | Ephemeral personal data | Dies at game end. Don't persist named submissions tied to accounts longer than the session needs. |
| **The works corpus** (pieces, crowned names, secrets, caught/free) | **Anonymized, out of scope** — *if you keep it unlinked* | Store works with **no foreign key to an account.** Content, not people. This is the research/POD asset and it stays clean. |
| **Leaderboard** | Personal data (a handle + score) | Self-chosen handle, user-clearable, deletable with the account. |

The discipline that makes it work: **the works corpus must not be joinable to the accounts table.** The moment a painted piece can be traced to a logged-in human, the corpus stops being anonymous and inherits the full compliance weight. Keep the wall. Same lesson as the engine-level content firewall: enforce it in the schema, not the policy PDF.

New obligations the login switches on, all required before launch:
- A real privacy notice covering accounts (the existing draft covers the anonymous corpus; it now needs an accounts section).
- Data-rights endpoints: export my data, delete my account.
- A lawful basis for processing account data (consent / legitimate interest — counsel decides).
- **Moderation, which strangers force regardless of login** — see §7.

---

## 7. The thing strangers add that nothing else does: moderation

A solo game or a friends' room is self-policing. **A stranger lobby with AI-generated images and player-typed names is a public content surface**, and that is a different risk class. Required, not optional:

- The engine content firewall (no faces, no famous, no porn) — already designed, now load-bearing.
- A **report button** on every piece and every name.
- Text filtering on submitted names.
- Rate limits and abuse throttling per account/IP.
- A path to ban and to take down.

Skipping this is how a clever party game becomes a headline. For a stranger product it is part of the minimum build, not a later polish.

---

## 8. Build it in phases (do not build §1–7 at once)

```
Phase 0  Same-room prototype ............................. DONE (the HTML)
Phase 1  Private rooms by code (friends) ................. the social engine, simplest door
Phase 2  Stranger matchmaking (the storm + batcher) ...... automatic room-filling on Phase 1
Phase 3  Accounts / Google login / persistent Vault ...... identity + the privacy refit
Phase 4  Leaderboard + weekly POD prize flywheel ......... the marketing engine
```

Phase 1 delivers most of the *fun* (real humans, real-time) for a fraction of Phase 2's matchmaking complexity. Phase 2 is "fill the room automatically." Phase 3 is where the privacy posture changes — do it deliberately, with counsel, mid-litigation, behind the Pause. **Rooms-by-code first** is the single highest-leverage sequencing decision in this document.

---

## 9. Cost shape (brief)

- **Image generation stays the dominant variable cost** — pennies per painted clue, host-pays, capped by the rounds = players + 2 ceiling. Unchanged from the prototype's economics.
- **Real-time + server** add a modest, mostly-fixed cost (a managed realtime service + a small server). Small next to image-gen at any real scale.
- **Auth** is effectively free (Google OIDC).
- **Caching the painted clues** remains the one real cost lever, exactly as before.

---

## 10. Open decisions — the gaps, marked (PRIME DIRECTIVE)

These are *not* solved by this document. Solving them is the next design pass. The absence is the point — don't let a build start by guessing these silently:

1. **Wait-time fallback policy** — when the storm can't fill a table in `T` seconds: smaller table, bot-backfill, or Solo? (Bot-backfill is the thematically strongest candidate; undecided.)
2. **Target / min table size** — and how it interacts with the Imposter crown (needs 4+).
3. **Guest vs. forced login** — recommended guest-first; confirm.
4. **Bot players** — do machine "humans" fill empty seats? If yes, the Turing game gains a layer; if no, simpler. Undecided.
5. **Region / latency strategy** — match locally for a snappier clock, or globally for faster fills?
6. **Moderation depth** — report-only at launch, or active filtering? (For strangers, at least report + text filter is the floor.)
7. **Realtime vendor** — Colyseus vs. PartyKit vs. managed pub/sub. A dev should prototype one room before committing.
8. **Title clearance** — "Only Humans Can Score" is still not formally cleared. Independent of this build, still open.

---

*The studio makes without limit; the gallery shows with discipline. This blueprint is a thing the studio made. Whether and when it hangs on the wall is a Strategic-Pause decision, made deliberately, not because a good evening's momentum carried it there.*

**Only Humans Can Score.**
