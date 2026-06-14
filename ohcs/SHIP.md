# SHIP — Only Humans Can Score
### Priority one · public launch target: **Saturday, June 13, 2026**

```
┌────────────────────────────────────────────────────────────┐
│  HOLD.  DO NOT LAUNCH BEFORE SAT 2026-06-13.                 │
│  The build is ready to wait. Strategic Pause governs.        │
│  One blocker remains: a domain. Everything else is built.    │
└────────────────────────────────────────────────────────────┘
```

## What ships Saturday — the `public/` site

A complete static site, browser-only. The only "server" is a nightly job that rewrites one JSON
file. No accounts, no payments, no strangers, no uploads. That perimeter is what keeps it clean.

Pages: `index` (home) · `play` (the game) · `ticker` · `pricing` (informational) · `about` ·
`terms` · `privacy`. Plus `site.css`, self-hosted `fonts.css` + `fonts/`, `stats.json`,
`robots.txt`, `llms.txt`, `sitemap.xml`.

**The one blocker:** a domain (`onlyhumanscanscore.com`, +`.org` defensive). Buy it, point it at a
static host, upload `public/`.

## Deploy checklist (Saturday, not before)

1. **Domain** — register; point at the static host.
2. **Host** — GitHub Pages / Cloudflare Pages / Netlify. Upload `public/` as the web root.
3. **Verify routes** at the real host: `/`, `/play.html`, `/ticker.html`, `/pricing.html`,
   `/about.html`, `/terms.html`, `/privacy.html`, `/stats.json`, `/robots.txt`, `/llms.txt`,
   `/sitemap.xml`. Confirm `sitemap.xml` uses the real domain.
4. **Fonts** — confirm in the browser Network tab that the only font requests go to your own
   domain (zero `fonts.googleapis.com` / `fonts.gstatic.com`).
5. **Nightly job** — 00:01 America/New_York: regenerate `stats.json` (rates/buckets only, never
   per-game rows), commit it. Until real games exist, ship the honest empty snapshot.
6. **Permanence** — commit site + each nightly snapshot to git; submit the domain to the Internet
   Archive. The ticker becomes the dated, append-only record.
7. **Smoke** — one full game on phone + laptop; ticker loads the deployed `stats.json` (not the
   sample fallback); keyboard/contrast pass.

## NOT shipping Saturday (stays behind the wall)

- **Paid checkout** — `public/terms.html` describes the tiers; nothing can take money until an
  entity, counsel, and a processor exist. The pricing page is informational only.
- **Fuel** (`parked/fuel.html`) — image uploads bring CSAM-scanning/moderation duties, an age
  gate, retention rules, and vision-model cost. Paid-tier, parked.
- **The rated ladder (Elo)** — built and tested (`server/src/game/elo.js`, `test/elo.test.js`), gated paid-tier-only behind `auth/entitlement.js`. Off until the Pass is real.
- **Stranger multiplayer + login** (`server/`) — needs a host, real-time infra, real moderation.
- **The Elite Square / BTC** — crypto processor, KYC/AML posture, tax handling, the council charter.

Gates before any paid/stranger version (from the red-team): age gate (COPPA), true anonymization,
AI-art IP, content moderation incl. CSAM reporting. None gate the clean static launch.

## The hold, restated

Ready to wait. Buying the domain and seeding this private repo are prep — the same category as the
domain in a cart — and do not move the date or make anything public. The radius is set; the area
reveals itself **Saturday, June 13, 2026.**

**Only Humans Can Score.**
