# Accessibility — Only Humans Can Score

**Target standard:** WCAG 2.1 Level AA (with the WCAG 2.2 focus-appearance criterion, 2.4.11, treated as in-scope).
**Last reviewed:** June 7, 2026.
**Method:** manual source audit of every page plus contrast computed directly from the hex tokens. This is an engineering review, not a certified audit — see *Method and honest limits* below for what that does and does not establish.

A civic-literacy product that excludes a reader has failed before it begins. The static launch surface (`public/`) is held to AA; the parked tiers (`parked/`, `server/`) are held to the same standard so nothing degrades when they eventually ship.

---

## Conformance summary

| Surface | `lang` | `main` landmark | Visible focus | Reduced motion | Live region | Keyboard-operable controls |
|---|---|---|---|---|---|---|
| `public/index.html` | ✓ | ✓ | ✓ (shell) | ✓ (shell) | n/a | ✓ |
| `public/about.html` | ✓ | ✓ | ✓ | ✓ | n/a | ✓ |
| `public/pricing.html` | ✓ | ✓ | ✓ | ✓ | n/a | ✓ |
| `public/privacy.html` | ✓ | ✓ | ✓ | ✓ | n/a | ✓ |
| `public/terms.html` | ✓ | ✓ | ✓ | ✓ | n/a | ✓ |
| `public/ticker.html` | ✓ | ✓ | ✓ | ✓ | n/a | ✓ |
| `public/play.html` *(the game)* | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `parked/fuel.html` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `server/public/` *(lobby + realtime client)* | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

"n/a" for live regions marks pages with no asynchronous content to announce. The four shell pages carry a skip link; single-screen pages (`terms`, `ticker`, `play`, `fuel`, the lobby) do not, by design — see *Deliberate non-actions*.

---

## Success criteria addressed

- **1.4.3 Contrast (Minimum).** Body text (`--bone` on `--wall`) and dimmed text (`--bone-dim`) clear 4.5:1. The `--faint` token was 3.47:1 against the wall — below the floor for the 11–14px kickers and footer text that used it — and was lifted to `#827d90`, computed at ~4.73:1. Brass and steel button labels use dark ink on light fills and clear the threshold by a wide margin.
- **2.1.1 Keyboard.** All interactive controls are reachable and operable by keyboard. The game's choice cards and the lobby's crown/flag cards are real `<button>` elements, not click-handled `<div>`s; the lobby cards were converted during this pass to close a Level A gap.
- **2.2.1 Timing Adjustable.** The game's flag phase is timed and the timer feeds a speed multiplier. A **Relaxed mode** disables the countdown and sets the multiplier to 1, making every phase playable without time pressure. The accommodation is a player choice at setup, not a buried setting.
- **2.3.3 Animation from Interactions / reduced motion.** `prefers-reduced-motion: reduce` collapses transitions, the screen-rise animation, smooth scrolling, and the end-credits crawl. Honored across the shell and every standalone surface.
- **2.4.1 Bypass Blocks.** The four pages that share the top navigation carry a "Skip to content" link that targets the `main` landmark.
- **2.4.7 Focus Visible / 2.4.11 Focus Appearance.** A `:focus-visible` indicator (brass ring, offset, with a bone ring on brass buttons and a silver ring on cool buttons so the indicator never camouflages against its own control) applies everywhere. Form fields carry their own brass focus state.
- **3.1.1 Language of Page.** Every page declares `lang="en"`.
- **4.1.2 Name, Role, Value / 4.1.3 Status Messages.** Dynamically generated cards carry descriptive `aria-label`s ("Crown as Sublime: …", "Flag as the machine: …"). Game state changes — episode start, whose turn, screen transitions — are announced through a polite `role="status"` live region. On screen change, focus is moved to the new screen container so keyboard and screen-reader users are not stranded on a hidden control.

---

## What this pass changed

Most of the access work predates this review. The game shipped with a focus indicator, a live region, focus management, real buttons, input escaping, reduced-motion handling, and Relaxed mode already in place. The gaps were concentrated in the surfaces that surround the game.

- **Shared shell (`public/site.css`):** added the `:focus-visible` system, lifted `--faint` to clear contrast, added `prefers-reduced-motion` handling, and added the skip-link style.
- **Four content pages:** added a skip link and a `main` landmark to each.
- **`terms.html`, `ticker.html`:** added a `main` landmark and a focus indicator (`ticker` already handled reduced motion; `terms` did not, and now does).
- **`parked/fuel.html`:** added a `main` landmark and a focus indicator (live region and reduced-motion handling were already present).
- **`server/public/`:** added a `main` landmark and a live region to the lobby, added the visually-hidden utility and a button reset to its stylesheet, and converted the realtime client's crown and flag cards from mouse-only `<div>`s to keyboard-operable `<button>`s with labels. The lobby's `show()` now moves focus to the active screen and announces it.

---

## Deliberate non-actions

The judgment is as much in what was left alone as in what was changed.

- **No skip link on single-screen surfaces** (`play`, `fuel`, `terms`, `ticker`, the lobby). 2.4.1 exists to bypass blocks of content repeated across pages. These pages have no repeated top navigation, so a skip link would be ceremony, not access. The `main` landmark gives assistive-technology users a jump target via landmark navigation instead.
- **AA, not AAA.** Contrast targets the 4.5:1 AA floor, not the 7:1 AAA enhanced level. The `--faint` fix was tuned to clear AA while preserving the intended "faint" tone rather than overshooting and flattening the palette.
- **Relaxed mode left as designed.** The timer and its scoring multiplier are a game-balance decision. The accommodation (turning both off) is present and complete; redesigning the scored mechanic itself is out of scope for an accessibility pass.
- **Parked tiers fixed but still gated.** `parked/` and `server/` carry the full access standard, but they remain pre-launch for unrelated reasons (payment processor, hosting, content moderation including CSAM reporting, age gate). Accessibility conformance does not lift those gates.

---

## Method and honest limits

This review is a manual source audit plus contrast arithmetic. By a strict evidence standard that is **sufficient for the structural and contrast claims** above — those are verifiable from the source and the math — and **incomplete as a conformance certification.** The following are not yet done and are not claimed:

- No pass on real assistive-technology hardware (VoiceOver, NVDA, JAWS, TalkBack). Live regions and focus management are implemented to spec but have not been confirmed against a shipping screen reader.
- No automated tooling sweep (axe, Lighthouse, WAVE) has been run against the built site at a real host.
- Contrast was computed from the design tokens, not sampled from rendered pixels over the noise/gradient background layers; the body and dim text clear AA with enough margin that the texture overlays do not threaten the result, but this was reasoned, not measured.

The honest grade: **structural keyboard, landmark, focus, and contrast conformance — well-supported. Full AA certification — pending an AT pass and an automated sweep at the launch host.** Both belong on the deploy checklist (`SHIP.md`, step 7) before the access claim is made in public.

---

## Maintaining this

- New interactive elements are `<button>` or a native control — never a click-handled `<div>`.
- New asynchronous state routes a short message through the `#live` region.
- New color tokens are checked against the background for 4.5:1 before they ship.
- New pages get `lang`, a `main` landmark, the focus system, and reduced-motion handling — and a skip link if they introduce repeated navigation.
- The AT pass and the automated sweep run at the real host before launch, per `SHIP.md`.

*Only humans can score. All of them.*
