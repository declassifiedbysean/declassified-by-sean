# OHCS — Acceptable Use & Ethics: Implementation Note

*Working draft, June 7, 2026. Internal. Not legal advice — counsel finalizes before launch.*

This note connects the research explainer to what actually ships. It says, for each finding, what the platform does about it, where that lives in the code/policy, and what stays open for counsel.

---

## What got built this pass
- **`acceptable-use.html`** — the Acceptable Use Policy (AUP). The binding "what you may and may not submit." Linked in every shell-page footer.
- **`ethics.html`** — the Ethics Framework. The "why," the principles we'd hold even where no rule names the case. Linked alongside the AUP.
- Footers updated site-wide (index, about, how-to, pricing, privacy) to carry **Acceptable Use · Ethics · Terms · Privacy**.

The AUP is written to be consistent with the existing **Privacy** page (anonymous-by-default, no IP logging against game data). The reconciliation: the § 2258A preserve-and-report duty is named as the *one narrow, legally-compelled exception* to the no-logging default — not a general surveillance license. The two pages now point at each other and don't contradict.

---

## Finding → implementation map

**1. Obscenity is a narrow legal category (Miller); most offensive text is protected speech.**
→ The AUP bans hardcore/obscene content as a **house rule under Section 230(c)(2)**, not by claiming it's "legally obscene." Language is explicit that bans are our contractual standard, not a legal conclusion. *No code change; policy framing.*

**2. "I know it when I see it" is not a test; the Ron Jeremy case is not precedent.**
→ Neither is cited anywhere in the shipped policy. The research doc carries the correction so it never reaches a public page. *Done.*

**3. § 2258A mandatory reporting (actual knowledge → NCMEC; 1-year preservation; up to $600k first-offense for <100M MAU).**
→ AUP "How we handle the worst case" states the remove → preserve → report flow in plain language. **Open for build:** a documented internal CSAM response protocol (secure preservation location, access restriction, NCMEC registration) before any public submission box goes live. **Open for counsel:** confirm current statutory figures and the registration mechanics.

**4. No affirmative duty to search; honeypots risk government-agent taint (Ackerman) and evidence suppression.**
→ This is the spine of the refusal to build the "open honeypot." Both the AUP ("we do not hunt, bait, or set traps") and the Ethics Framework (§4 "We don't bait") state it as principle. **The trap-card / IP-flagging / forward-to-authorities feature is intentionally not built and should stay unbuilt.** If automated detection is ever added, it must be genuinely voluntary and business-driven, not at law-enforcement direction.

**5. Section 230(c)(2) protects moderation; federal criminal law + FOSTA carve-outs are the exceptions.**
→ AUP "Why we can set these rules" explains the moderation right; the minor-safety and trafficking lines are framed as where private rule and public law align. *Policy framing; done.*

**6. California: § 311 (CSAM, no obscenity showing required), CCPA/CPRA retention disclosure; AB 587 and AADC largely enjoined.**
→ CSAM ban already absolute. **Open for counsel/build:** if CCPA thresholds are ever crossed (~100k users), add notice-at-collection + concrete retention periods. AB 587 / AADC are not built against (correctly — enjoined and/or inapplicable to a small operator). The Privacy page's concrete-retention language already moves toward CPRA alignment.

**7. EU DSA: notice-and-action, statements of reasons, ToS transparency; micro/small-enterprise exemptions from heavy duties.**
→ AUP "Enforcement" promises reporting tools and removal explanations where DSA applies. **Open for build (only if genuinely targeting EU):** a notice-and-action reporting mechanism and statement-of-reasons on removals. Confirm small-enterprise exemption status.

**8. UK Online Safety Act: illegal-content + child-safety duties on nearly all in-scope services; Ofcom enforcement live.**
→ **Open for build (if targeting UK):** a documented illegal-content risk assessment and a complaints/reporting process. Baseline duties apply even to small low-risk services.

**9. GDPR/UK GDPR: IPs are personal data; legitimate-interests basis for security logging; transparency + minimization.**
→ The § 2258A exception is framed narrowly to stay defensible. **Open for build:** a Legitimate Interests Assessment for any security logging, and privacy-notice language covering the reporting exception. Coordinate with the Privacy page.

**10. Asia — documented gap.**
→ Ethics Framework §7 commits to naming uncertainty. **Open:** no Asian-market launch without dedicated local counsel. Logged, not silently skipped.

---

## The table-flip mechanic (separately)
Per the earlier build, "table-flip" is a **game gesture** (flip the table → forfeit the round, with a wink). It is being kept as exactly that — a community-norms / gameplay bit in the game layer. It is **not** wired to abuse enforcement, IP flagging, or reporting, and the AUP/Ethics pages don't reference it. The honest content policy and the game gag stay in separate registers and don't contaminate each other.

---

## Moving targets to monitor (revisit, don't hard-code)
- **EU CSA Regulation ("Chat Control")** — trilogue; political-agreement target ~July 2026. Could change detection/reporting expectations.
- **UK OSA categorisation register (July 2026)** + new Ofcom codes (age assurance, automated detection).
- **California AADC** post-March-2026 Ninth Circuit remand.
- **§ 2258A figures** — REPORT Act regime still being amended; confirm before relying on numbers.

## Triggers that change the analysis
Crossing ~100k users; adding direct messaging or image/video upload; any commercial-sex/dating adjacency; establishing an EU/UK entity; exceeding €10M turnover / 50 staff.

---

## Counsel checklist (before launch)
1. Finalize AUP + Ethics + Privacy + Terms as a consistent set.
2. Confirm § 2258A registration + internal CSAM response protocol.
3. Decide EU/UK targeting → build notice-and-action + risk assessment if yes.
4. Confirm CCPA applicability + retention schedule.
5. Resolve the open Terms items (venue clause; arbitration in/out).
