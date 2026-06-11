# OHS — Launch Build v1 (executed)

Execution of `OHS LAUNCH SPEC — June 9, 2026 (v1 locked)` against the laptop
source. The spec was the plan; this is the act. Build only — **not deployed.**
The June 13 HOLD and the Strategic Pause govern: the build waits.

## What the spec asked → what this build did

1. **Music engine gating.** Free play ships the **Ambient** backdrop (default,
   fully synthesized). Country, Rap, and Jazz are now **visible but locked**
   (`🔒 Premium`) in the soundtrack picker, with an upgrade caption pointing to
   pricing. A free-genre guard in `play.js` forces Ambient regardless of the
   selected value, so the lock cannot be bypassed by tampering with the option.
   — `public/play.html`, `public/play.js`

2. **Feature blackout (Radical Legibility — OUT disciplined).** Already
   satisfied by the source: `pricing.html` carries the *“not yet on sale”*
   parked banner and has **no live checkout**; the premium soundtracks now carry
   the same `Coming soon` register. Nothing is promised that isn't live.

3. **Single-engine collapse.** Already satisfied: `public/` is the OHS engine
   only. The remaining `declassifiedbysean.com` references are builder
   attribution, the legal operator name, and schema metadata — kept on purpose.
   The political engine is not surfaced anywhere in the launch view.

4. **Warranty disclaimer (Settings/About).** Added an *as-is, no warranties*
   Terms-of-Use section to `about.html` (`#warranty`), adapted to the OHS engine
   — soundtrack, scoring, availability, no liability. The Declassified-specific
   claim/Bogost/Benkler clauses were dropped: the Two Engines don't contaminate.

## Not done (on purpose)
- **No deploy.** No domain, no host push. The build is ready to wait.
- Server / paid tier / Fuel / Elo / Elite Square stay parked behind the wall.

## Verification
- `node --check` clean on `play.js`, `music.js`, `narration.js`.
- Static site served locally: all pages 200; the three changes assert present.
