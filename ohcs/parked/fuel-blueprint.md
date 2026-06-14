# FUEL — Man v Machine · Blueprint

> **PAID TIER. BEHIND THE WALL. NOT IN THE SATURDAY (June 13) SHIP.**
> The reverse of *Only Humans Can Score*: a human feeds specimens, the machine must
> detect human-made vs AI-generated. Prototype: `fuel-mode-man-v-machine.html`.

---

## The concept

The free game asks: *can a human tell the machine's output from a human's when naming it?*
Fuel runs it backwards and one-on-one: **can a human out-fool the machine at the detection
task itself?** You (the forger) feed a specimen and secretly know its true origin. Charlissian
(the eye) must call it. You score by stumping it; it scores by catching you. Best of N.

Why the name: every round is **fuel** — it powers two tanks at once. The detection corpus
(data that layers into the Turing Ticker) and, downstream, the paid tier that funds the book.
The duel is the form; fueling the record is the function.

## Match design

- **2 players only:** one human + Charlissian. Always man v machine.
- **Best of 3 / 5 / 7.** Play all rounds, higher score wins; tie = stalemate (record keeps both).
- **Round (your serve):** upload a specimen → privately tag the truth (human / AI) → send.
  The machine sees only the image, returns `verdict · confidence · tell · name`. Reveal:
  machine correct = machine point; machine wrong = your point.
- **Symmetric half (PARKED, not in prototype):** *the machine serves you* specimens to detect.
  Requires a **provenance-cleared specimen library** (known-origin human + AI images with
  cleared rights) — a real backend asset, not something to fake client-side. Build it behind
  the wall or not at all; a detection game with mislabeled specimens poisons its own data.

## How it becomes fuel (the data layering)

Each round yields one anonymized datum — **never the image**:

```
{ specimenType, declaredOrigin, machineVerdict, machineConfidence, outcome, modelId, ts }
```

Aggregated nightly into a new Turing Ticker board:
- **Machine detection accuracy over time** (does the eye get better or worse?).
- **Human stump-rate** against it (are humans finding the seams?).
- Split by model, by specimen type, compounded nightly → monthly → yearly like the rest.

This is the layer the request asked for: the main game measures naming; Fuel measures
*detection*; together they bracket the Turing question from both sides.

## Honesty rails (carry into the live build)

- **Not a detector.** The verdict comes from a general vision model, not a forensic
  provenance tool. Neither humans nor machines reliably tell AI from human work — that
  uncertainty is the *point*, not a bug. Never present a verdict as authentication.
- **Declared origin is unverified.** The truth tag is the player's word. For a trustworthy
  corpus, the real path is **C2PA / Content Credentials** (cryptographic provenance), parked.
- **No claims about real works or people.** A Fuel verdict must never be usable to accuse a
  real artist or label a real image. Keep specimens to artwork/objects/scenes.

## The wall — why this cannot be casual (the teeth)

The instant users upload media, the obligations change category:

1. **CSAM scanning & reporting (non-negotiable).** A service that accepts user image uploads
   must scan for child sexual abuse material and has reporting duties (e.g., to NCMEC in the
   US). This requires a real pipeline (hash-matching + classifier + human review + reporting),
   not a checkbox. **This single requirement is the main reason Fuel is gated.**
2. **Age gate / COPPA.** 18+ enforced before upload, not a self-tick.
3. **Content moderation queue.** Faces, minors, explicit, illegal, hate — automated pre-screen
   + human review + appeals + audit log.
4. **Retention & privacy.** Images sent to a vision provider: disclose it, minimize it, define
   retention (ideally process-and-discard), DPA with the provider, regional rules.
5. **Cost = paid.** Vision inference per round is a real per-use cost; the paid tier funds it.
6. **Copyright / likeness.** Uploaders warrant rights; likeness rules (Article VI) enforced.
7. **Entity + counsel + processor** before a dollar moves (shared with the rest of the wall).

## The RoboCop Award (monthly recognition)

Each calendar month, the human with the highest **stump-rate** in Fuel — the best at telling
human work from machine work — takes the **RoboCop Award** and a spot on the board. Part
curator, part machine-hunter. It is the engagement loop that turns one-off duels into a
returning monthly contest, and it is human-judged by definition (stump-rate is just outcomes
of human-served specimens vs. the machine's calls).

> **Trademark — FLAGGED, RETAINED BY OWNER (eyes-open).** "RoboCop" is a registered franchise
> mark. The owner elects to keep the name as a deliberate Asymmetric-Warfare / Streisand play: if a
> cease-and-desist arrives, publish it, tell the story (a Hollywood rights-holder leaning on a
> civic-literacy game about who gets counted as a person), and rename with a wink — the **publicity
> is the fuel**, not a courtroom win. Stated defense theory is **trademark expressive-use / parody**
> (Rogers line) — *not* copyright "fair use," which is the wrong doctrine for a brand name. Honest
> caveat: *Jack Daniel's v. VIP Products* (SCOTUS 2023) narrowed that shield precisely when a mark is
> used as one's own feature/brand name, so escalation likely ends in **rename, not victory** — which
> is fine, because the rename is the chapter. **Hold the line:** keep it as flavor-with-a-fuse, do
> **not** make it a load-bearing pillar of the paid brand (un-naming a marketed feature is the only
> expensive version). Counsel to bless the strategy before commercial scale.

## Hidden — the easter egg

Fuel carries one buried reference, discoverable two ways: the Konami code
(↑ ↑ ↓ ↓ ← → ← → b a) or tapping the "Charlissian · the eye" label five times. It reveals the
machine's "true designation" — a red optical sensor, *Cyberdyne Systems · Model 101*, and the
line *I'll be back* — then fades. **Trademark flag:** a hidden film-quote nod is low-risk, but
the Terminator/Cyberdyne marks are owned; keep it an unadvertised easter egg, and have counsel
bless even that before it ships commercially.

## Pricing (lives in the checkout terms)

The paid ladder that gates Fuel and the prize economy (see `checkout-terms.html`):
Daily **$3.14**, Monthly **$31.69**, Annual **$301.69**, Lifetime **$3,141.69 (one-time)**, and the apex
**Elite Square — 1 BTC (one-time, strictly limited)**.
The fiat numbers are a deliberate π gag — it opens on real pi (3.14) and then drifts into 69s where a
pedant expects 31.41 / 314.15 / 3141.59; noticing the drift is itself a tell. **Lifetime memorializes
the holder by name on a patrons wall**; the **Elite Square** grants a permanent named square on the
Founders' Wall plus a *bounded* editorial voice (council seat + votes on which features/causes/prize
mechanics — **never** the core thesis or the author's manuscript: a voice and a square, not the pen).

> **The mirror (read this as design, not accident).** The Elite Square lets money buy a permanent place
> and an editorial voice — inside a project arguing *against* money buying voice (Citizens United, corporate
> personhood). That is the exhibit, on purpose: the apex tier *enacts the critique* so a visitor stands inside
> it. Framed as deliberate commentary it sharpens the thesis; framed sincerely it would gut it. Keep the
> framing explicit and the editorial scope bounded, or the joke becomes the self-own.

> **BTC honesty flags.** 1 BTC is a moving fiat figure (accounting/tax/refund complexity); crypto is
> irreversible (no chargebacks → Elite Square is final-sale, no refund window); crypto receipts carry tax +
> possible money-transmission/KYC exposure; needs a separate processor from the fiat path. Counsel + tax
> advisor before it opens.

All of it is parked behind the wall with the rest of the paid tier; none ships June 13.

## Prototype status

`fuel-mode-man-v-machine.html` implements the **your-serve** duel fully and live in-canvas
(real vision call, content gate, scoring, ledger, end summary). It stores nothing. The
machine-serve half, the provenance library, the moderation pipeline, and the Ticker
integration are specified here and parked. Place this file under `docs/` or a `parked/`
area in the repo — **never under `public/`.**

**Only Humans Can Score.** Even here, the machine guesses, confides a tell, and names the
piece — and still cannot score itself. You concede the points or you take them. The scoring
stays human.
