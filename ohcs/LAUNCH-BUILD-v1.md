# OHS — Launch Build v1 (executed) + June 11 fold

Execution of `OHS LAUNCH SPEC — June 9, 2026 (v1 locked)` against the laptop
source, then a fold of the June 10 rebuild packet's OHS constraints. Build only
— **not deployed.** The June 13 HOLD and the Strategic Pause govern: the build
waits.

## Launch spec, executed (June 9)

1. **Music engine gating.** Free play ships the **Ambient** backdrop (default,
   fully synthesized). Country, Rap, and Jazz are **visible but locked**
   (`🔒 Premium`) in the soundtrack picker, with an upgrade caption. A free-genre
   guard in `play.js` forces Ambient regardless of the selected value, so the
   lock cannot be bypassed by tampering with the option.
   — `public/play.html`, `public/play.js`

2. **Feature blackout (Radical Legibility — OUT disciplined).** Already
   satisfied by the source: `pricing.html` carries the *"not yet on sale"*
   parked banner and has **no live checkout**; the premium soundtracks now carry
   the same `Coming soon` register. Nothing is promised that isn't live.

3. **Single-engine collapse.** Already satisfied: `public/` is the OHS engine
   only. The remaining `declassifiedbysean.com` references are builder
   attribution, the legal operator name, and schema metadata — kept on purpose.

4. **Warranty disclaimer (Settings/About).** Added an *as-is, no warranties*
   Terms-of-Use section to `about.html` (`#warranty`), scoped to the OHS engine.
   The Declassified-specific claim/Bogost/Benkler clauses were dropped: the Two
   Engines don't contaminate.

## Fold — June 11 (from `open-loops-zipped-laptop-rebuild-packet-2026-06-10`, item B-2)

- **OHCS → OHS rename.** Every user-facing `OHCS` on the build surface is now
  `OHS` (nav brand, back-links, the fax label). The JS globals followed:
  `OHCSMusic`/`OHCSVoice` → `OHSMusic`/`OHSVoice`, defs and call sites together.
  Internal filenames and the `ohcs/` dir are left as-is (not user-facing).
- **Machine player → Rando Carlissian.** `Charlissian` → `Rando Carlissian`
  across `play.js`, `play.html`, `about.html`, `how-to.html` (12 spots).
- **Pricing: Weekly $9.42 (3π) added alongside.** New Weekly Pass inserted
  between Daily and Monthly; the rest of the ladder (Daily/Monthly/Annual/
  Lifetime/Elite) is unchanged per the June 9 lock. A `.c4` card grid was added
  to `site.css`. (Per the operator's call — the packet said "locked Weekly," the
  June 9 spec said "do not change"; resolved as additive.)
- **Security flag (client-side keys behind a proxy).** Already moot in the
  static build: `callClaude()` carries no key and throws
  `"static build: house deck only"` — the live model path is disabled and the
  game falls back to the house deck. The proxy work belongs to the parked server.

## Not done (on purpose)
- **No deploy.** No domain, no host push. The build is ready to wait.
- Server / paid tier / Fuel / Elo / Elite Square stay parked behind the wall.
- Packet items outside the OHS build (comic render, alpha42 fold, Cloak & Dagger,
  index/handoff cleanup) are out of scope here — and the alpha42 pi-digit fold is
  the operator's call, not the instrument's.

## Verification
- `node --check` clean on `play.js`, `music.js`, `narration.js`, `fax.js`, `ticker.js`.
- Static site served locally: all pages 200; renames, machine name, the Weekly
  tier, the soundtrack locks, and the warranty section all assert present.
