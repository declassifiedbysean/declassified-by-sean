# DECLASSIFIED — Integration Guide

The site now runs on a **registry**: `games.json` is the single source of truth
for every game, resource, and nav/footer link. The Act III footer bug (a game
launched but never added to the hand-copied footer lists) is the disease this
cures — link lists can no longer drift, because nothing is hand-copied.

## Add a new game (the whole procedure)

1. Drop your game file in the repo root (e.g. `declassified-act6.html`).
   It can be fully self-contained, exactly like the existing acts.
2. Add **one entry** to `games[]` in `games.json`:

```json
{
  "id": "act6",
  "act": "Act VI",
  "title": "The Verdict",
  "era": "2026–",
  "blurb": "One paragraph, your register: what the act covers, which patterns it introduces.",
  "claims": 10,
  "href": "declassified-act6.html",
  "redirect": "/act6",
  "status": "new"
}
```

3. Run the builder:

```
python3 tools/build-site.py
```

That regenerates the homepage game cards, the footer Games list on every page
that carries the markers, and **appends the `/act6` Netlify redirect**
automatically. Commit. Done — no HTML cloning, no hand-edited lists.

`status` values: `"live"` (default, no badge) · `"new"` (green badge) ·
`"soon"` (orange badge).

## How the rendering works (two layers, pick per page)

**Static (SEO-grade) — used by `index.html`.** Pages carry marker comments:

```html
<!-- BEGIN:GAMES --><!-- END:GAMES -->
<!-- BEGIN:RESOURCES --><!-- END:RESOURCES -->
<!-- BEGIN:NAV --><!-- END:NAV -->
<!-- BEGIN:FOOTER --><!-- END:FOOTER -->
```

`tools/build-site.py` rewrites only what's between markers; everything else on
the page is yours and never touched. The output is plain static HTML — crawlers
and no-JS readers see everything.

**Runtime (drop-in shell) — for any other page.** Two lines:

```html
<link rel="stylesheet" href="assets/site.css">
<script src="assets/site.js" defer></script>
```

then place `<div data-site-nav></div>` and/or `<div data-site-footer></div>`
where the nav/footer should appear. They render from `games.json` at load.
Pages without the markers are left completely untouched, so including the
script anywhere is safe. Game pages can read the registry themselves via
`window.DECLASSIFIED.registry()`.

## The design system

`assets/site.css` is the extracted look — the navy/amber palette, Special
Elite / Oswald / Share Tech Mono, the scanline + vignette overlays (`body
class="fx"`), cards, buttons, prose pages, focus states, and
`prefers-reduced-motion` support. New pages should link it instead of carrying
a private `<style>` copy. The existing act pages keep their inline styles and
work unchanged — migrate them opportunistically, not wholesale.

## Files

| File | Role |
|---|---|
| `games.json` | The registry — the only file you edit to add/retire a game |
| `tools/build-site.py` | Renders marker regions + syncs Netlify redirects |
| `assets/site.css` | Shared design system |
| `assets/site.js` | Runtime nav/footer shell + registry helper |
| `INTEGRATION.md` | This guide |

## Found and fixed in this rebuild

- Footer "Games" list was missing **Act III** on every page that carried it.
- `netlify.toml` had **no `/act3` redirect** (page existed, short URL 404'd);
  `/dossier` had none either. The builder now syncs these from the registry.
