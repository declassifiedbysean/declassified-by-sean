# Only Humans Can Score

A humane party game and a running experiment in human-vs-machine judgment.
The machine paints clues and guesses; **only humans can score.** The game is the argument —
about authorship, judgment, and who gets to be counted as a person.

> **Status:** pre-launch. Public launch target **Saturday, June 13, 2026** — the free, static
> site only. The paid tier and backend are built and **parked behind the wall**. A private repo
> is prep, not launch. See `SHIP.md`.

---

## What this repo is

A complete static site (`public/`), a parked paid-tier prototype (`parked/`), a parked Node
backend (`server/`), and governance docs (`docs/`). The site is plain HTML/CSS/JS — no build
step, no framework. Drop `public/` on any static host.

```
public/                 ← THE SITE (ships June 13). Static, anonymous, no backend.
  index.html            front door
  play.html             the game (same-room, pass-the-device; live model call disabled)
  ticker.html           the Turing Ticker (nightly→monthly→yearly; robotable, CC0)
  pricing.html          the five tiers (informational; NO live checkout)
  about.html            the law, how it works, the thesis, FAQ
  terms.html            terms of sale (paid tier) — public reference
  privacy.html          privacy notice (public reference)
  site.css              shared design system
  fonts.css + fonts/    self-hosted Cormorant Garamond + IBM Plex Mono (OFL-1.1) — no Google Fonts
  stats.json            nightly snapshot the ticker reads (ships empty/awaiting)
  robots.txt llms.txt sitemap.xml   robotable: AI crawlers welcomed, CC0 by design

parked/                 ← PAID TIER. NOT shipped. Needs counsel/processor/moderation.
  fuel.html             Fuel — the man-v-machine detection duel (uploads → vision verdict)
  fuel-blueprint.md     design, data layering, RoboCop Award, BTC flags, the wall requirements

server/                 ← PARKED. Node app for stranger multiplayer + login.
  npm install && npm start   (runs with zero config on the house deck)
  npm test                   (smoke + patch checks)

docs/                   ← internal: red-team, lobby/login blueprint, vault blueprint, full notices
SHIP.md  LICENSE  .gitignore  .env.example
```

## The two perimeters (read before touching anything)

**Static site (ships Saturday) — clean.** No accounts, no payments, no strangers, no uploaded
media, no stored corpus. `play.html` has the live model call disabled and always uses the house
deck. The pricing page *describes* the tiers; it cannot take money. This is what makes it shippable.

**Paid / stranger / upload (parked) — has teeth.** Accounts, payments, the Fuel image uploads, a
persistent corpus → age gate (COPPA), real anonymization, content moderation **including CSAM
scanning & reporting the instant users can upload media**, retention, an entity, counsel, a
processor. None of that is in scope for launch. **Do not migrate `parked/` or `server/` into
`public/`.**

## Pricing (planned; gated behind the wall)

Daily **$3.14** · Monthly **$31.69** · Annual **$301.69** · Lifetime **$3,141.69 (one-time, name on the
patrons' wall)** · **The Elite Square — 1 BTC** (one-time, strictly limited: a permanent named square
plus a *bounded binding vote* — a voice and a square, **not the pen**). The fiat numbers are a
deliberate π gag. The Elite Square is the mirror, on purpose. Full terms in `public/terms.html`.

## Run the parked server (local dev only)

```bash
cd server && cp .env.example .env   # safe defaults; runs with NONE set
npm install && npm start            # http://localhost:3000
npm test
```
Never commit a real `.env`. Keys stay out of git (`.gitignore`).

## Licensing — split on purpose

- **Code** (`server/`, the app logic in `public/*.html`): **All Rights Reserved** pre-launch. Open it
  later if you choose; you can't un-open it. See `LICENSE`.
- **Data & robotable layer** (`stats.json`, `robots.txt`, `llms.txt`, the ticker dataset): **CC0 1.0 /
  public domain by design** — load-bearing to the thesis. Declared in those files.
- **Fonts** (`public/fonts/`): SIL **OFL-1.1** (their own licenses travel with them).

---

**Only Humans Can Score.** The machine paints, guesses, and bluffs. The scoring is ours.
