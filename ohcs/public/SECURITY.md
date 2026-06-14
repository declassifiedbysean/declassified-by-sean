# Security posture — Only Humans Can Score (launch surface: /public)

*Working notes, June 7 2026. Static site on GitHub Pages (private repo, public site).*

## What's in place
- **Content-Security-Policy** delivered via `<meta http-equiv>` on every page. Strict: `default-src 'self'`,
  `script-src 'self'` (no inline/external script — this is the real XSS backstop), `font-src 'self'`,
  `img-src 'self' data:`, `connect-src 'self'`, `base-uri 'none'`, `form-action 'none'`, `object-src 'none'`.
- **Referrer-Policy** `strict-origin-when-cross-origin` via `<meta name="referrer">`.
- **XSS:** all user input (player names, captions, secrets) passes through `escapeHtml()` before any
  `innerHTML`. The one assembled sink (`revLine` in play.html) carries a guard comment.
- **stats.json** is coerced into a known shape at render time so a malformed/tampered file degrades
  gracefully instead of rendering junk.
- **No third-party loads.** Fonts are self-hosted (SIL OFL). One `fetch`, to own `./stats.json`.

## Known gaps on GitHub Pages (cannot be fixed on Pages itself)
- **`style-src 'unsafe-inline'`** is required — pages use inline `style=""` attributes and an inline
  `<style>` block in play.html. Script policy stays strict; only *style* is loosened. Clean fix:
  migrate inline styles to classes in site.css (not launch-blocking).
- **`frame-ancestors` / clickjacking** — header-only directive, ignored when set via `<meta>`. Pages
  can't set response headers, so this gap is open until the site is fronted by Cloudflare.
- **HSTS, X-Content-Type-Options (nosniff)** — also header-only; not settable on Pages.

## Upgrade path (staged for when the domain lands)
- Front the custom domain through **Cloudflare (free)** to inject real response headers:
  full CSP (incl. `frame-ancestors 'none'`), HSTS, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy`. That converts the meta-CSP gaps above into enforced headers.
- On Pages: enable **"Enforce HTTPS"** once the custom-domain cert provisions.

## Operational trust boundary
- **stats.json write path is the real boundary.** Whatever generates the nightly file controls what
  the Ticker claims. Ensure only the trusted job can write it and that raw user submissions never
  reach it without a validate/sanitize step.

## Publish hygiene
- Publish **only `/public`**. Do not publish `server/`, `parked/`, or `docs/` — they contain parked
  backend code and internal notes that should not be served.

## Out of scope here
- The parked `server/` realtime tier needs its own review before it ships (WebSocket input handling,
  entitlement wall, rate-limiting).
