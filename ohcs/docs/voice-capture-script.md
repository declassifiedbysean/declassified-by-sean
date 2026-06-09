# "Sean Reads the Game Files" — Voice Capture Script

*The lines the narration mode plays. Record these in your own voice (free, most authentic) — or use this same text as the sample/consent script for a cloning service and batch-render. Either way the file names below are the manifest: save each clip as `voice/<id>.mp3`.*

---

## How to use this

1. **Record in one quiet session.** Phone or laptop mic is fine if the room is quiet — no fan, no AC, no traffic. Read at a steady, slightly-slower-than-conversational pace.
2. **One take per line, named by id.** Leave a beat of silence before and after each line so trimming is clean.
3. **Save each as `voice/<id>.mp3`** (or `.wav` then convert). Drop them in `public/voice/`.
4. **List the ids you recorded in `public/voice/manifest.json`** (template at the bottom). The mode only plays lines that are in the manifest — so you can ship a partial set and add more later; missing lines stay silent, never broken.
5. That's it. Toggle "Narration" on the setup screen and the clips play as each screen comes up.

**If you clone instead of record:** paste the consent line below + a few of these lines as your voice sample, render each line to its `<id>.mp3`, same manifest. A clone of *your own* voice with *your own* consent is squarely fine — and a one-line "AI rendering of the operator's voice" note to players is the honest touch.

**Consent line (for any cloning service's verification step):**
> "I am Sean McKendry. This is my own voice, and I consent to creating a synthetic voice from these recordings for use on my own project, Only Humans Can Score."

---

## The lines

### Screen narration (plays as each screen appears — ids match the game's screen states)

| id | line to read |
|---|---|
| `s-setup` | "Add your players. Three to nine humans, and the machine makes ten. Pick your soundtrack, and when everyone's in — we begin." |
| `s-secret` | "Captain. The secret is yours alone. Read it, hold it, hand the device on." |
| `s-paint` | "The machine is painting. Give it a moment — it's working in the dark, same as you." |
| `s-piece` | "Here is the machine's work. Study it. Somewhere in here is the secret it never saw." |
| `s-name` | "Name it. One caption, your best read of the room. The machine is writing one too — and it wants to pass for human." |
| `s-judge` | "Crown the names. The Sublime for the finest. The Troll for the gloriously worst. Choose with your whole chest." |
| `s-flag` | "Now the hard part. One of these came from the machine. Flag the impostor — if you can find it." |
| `s-flagrev` | "Here's what the machine wrote. See if anyone caught it." |
| `s-score` | "The board. Only humans can score — the machine plays for pride alone." |
| `s-final` | "That's the show. The judgments stay; the judges go home. Well played." |
| `s-vault` | "The vault. Your finest names and the machine's best forgeries, kept for the record." |

### The four crowns (played when a crown is awarded — optional, nice to have)

| id | line to read |
|---|---|
| `crown-sublime` | "The Sublime. The finest name at the table." |
| `crown-troll` | "The Troll. Gloriously, deliberately the worst." |
| `crown-flag` | "The Flag. Caught the machine red-handed." |
| `crown-imposter` | "The Imposter. A human who passed as the machine." |

### Signatures & flourishes (optional cold-open / sign-off)

| id | line to read |
|---|---|
| `intro` | "Only Humans Can Score. A machine paints, a room judges, and only humans keep the points. I'm Sean — I'll read you the files. Let's play." |
| `outro` | "That's the file. The rest is up to the humans." |
| `machine-walks` | "Nobody caught it. The machine walked free." |
| `machine-caught` | "Caught. The machine doesn't score tonight." |

---

## Recording notes for a clean result
- **Distance:** a hand-span from the mic, slightly off-axis so plosives ("p," "b") don't pop.
- **Tone:** you're a late-night curator reading a placard, not a hype man. Dry, warm, unhurried — it matches the room.
- **Consistency beats perfection:** same distance, same energy, same room across all lines so they sit together.
- **Keep the raw files.** If one line bugs you later, you re-record just that `<id>` and swap it — the manifest doesn't change.

---

## `voice/manifest.json` template
*List only the ids you actually recorded. Add more anytime.*

```json
{
  "ext": ".mp3",
  "lines": [
    "intro",
    "s-setup", "s-secret", "s-paint", "s-piece", "s-name",
    "s-judge", "s-flag", "s-flagrev", "s-score", "s-final", "s-vault",
    "crown-sublime", "crown-troll", "crown-flag", "crown-imposter",
    "machine-walks", "machine-caught", "outro"
  ]
}
```
