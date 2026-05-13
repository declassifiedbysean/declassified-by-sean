# DECLASSIFIED by Sean McKendry

**An independent political fact-checking game built on primary sources.**

🌐 **Live site:** [declassifiedbysean.com](https://declassifiedbysean.com)

---

## What Is DECLASSIFIED?

DECLASSIFIED is a browser-based educational game in which players evaluate political claims using actual primary sources — congressional records, court decisions, verified government data, official transcripts.

Each claim yields:
- A **verdict** (TRUE, FALSE, MISLEADING, or INSUFFICIENT INFO)
- A **Bogost Citation Tier** (STRONG / CAREFUL / WEAK / INSUFFICIENT)
- A **Phillips Pattern** (the rhetorical mechanism behind the claim)

No account required. Free to play. Works on any device.

---

## Game Arc

| Act | Period | Claims | Status |
|-----|--------|--------|--------|
| Act I: The Outsider | 2015–2016 | 10 | ✅ Live |
| Act II: The Transition | 2016–2017 | 10 | ✅ Live |
| Act III: The Reckoning | 2021–2024 | 10 | ✅ Live |
| Act IV: The Return | 2024–2026 | 10 | ✅ Live |
| Act V: The Crisis | 2025–2026 | 15 | ✅ Live |
| Record Forge | Ongoing | 6 | ✅ Live |
| **Total** | | **61** | |

---

## Analytical Frameworks

**Bogost Citation Scale** — rates evidentiary quality: STRONG (primary source) → CAREFUL (institutional consensus) → WEAK (contested) → INSUFFICIENT (no basis)

**Phillips Pattern Library** — taxonomy of rhetorical mechanisms: Inflated Metric, Selective Summary, False Equivalence, Institutional Delegitimization, Personal Attack, Mandate Overclaim, Victim Narrative, Preemptive Exoneration

**Benkler Calibration** — ASYMMETRIC difficulty mode weighting claims by historical impact, independent of truth value (Acts III–V)

---

## Site Structure

```
index.html              — Main hub, all acts
about.html              — About the platform and founder
press.html              — Full media kit and press FAQ
contact.html            — Contact page
privacy.html            — Privacy policy
disclaimer.html         — Legal disclaimer
glossary.html           — 42-term analytical glossary
404.html                — Custom 404

declassified-act1.html  — Act I: The Outsider (2015–2016)
declassified-act2-v3.html — Act II: The Transition (2016–2017)
declassified-act3.html  — Act III: The Reckoning (2021–2024)
declassified-act4.html  — Act IV: The Return (2024–2026)
declassified-act5.html  — Act V: The Crisis (2025–2026)
record-forge-s6.html    — Record Forge: Pro Se Litigation

netlify.toml            — Netlify config (clean URLs, headers, cache)
sitemap.xml             — SEO sitemap
robots.txt              — Crawler rules
ads.txt                 — AdSense publisher declaration
```

---

## Tech Stack

- Pure HTML/CSS/JavaScript — no framework, no build step
- Google Fonts (Special Elite, Oswald, Share Tech Mono)
- Google AdSense (`ca-pub-5212401863050678`)
- Deployed on Netlify
- Michigan Maize (`#FFCB05`) and Michigan Blue (`#00274C`) color identity

---

## Founder

**Sean W. McKendry** — Lansing, Michigan

B.A. Economics & Management, Albion College. Licensed Insurance Producer (P&C), all 50 states + D.C. Solo developer. Pro se plaintiff, *McKendry v. PNC Bank, N.A.*, Case No. 1:26-cv-00330-PLM-PJG (W.D. Mich.).

[linkedin.com/in/seanmckendry](https://linkedin.com/in/seanmckendry)

---

## Deployment

Deployed automatically via Netlify on push to `main`.

Site ID: `dd274e46-afd9-4d43-9b5f-e601b3840810`

---

## Editorial Independence

Advertisers have no influence over game content, claim selection, verdict assignment, or annotation text. The evidentiary record is the sole arbiter.

---

*The record is the arbiter.*
