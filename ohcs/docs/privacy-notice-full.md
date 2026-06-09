# ONLY HUMANS CAN SCORE — Data, Privacy & Cookie Notice (DRAFT)

> **Not legal advice.** This is a working draft to be reviewed and finalized by qualified
> privacy counsel in each operating jurisdiction **before** any data is collected for keeps.
> It is designed to *align with* the EU GDPR and California CCPA/CPRA — alignment is a
> counsel-and-testing determination, not something this document certifies.

---

## 0. The hinge (read this first)

**"Permanent" + "compliant" reconcile through *true anonymization*, not pseudonymization.**

- **Anonymous data** (irreversibly stripped of identifiers, not re-linkable) is **not personal
  data** under GDPR (Recital 26) and is **deidentified** under CPRA. It falls outside both
  regimes — so it may be retained **indefinitely**, and erasure/deletion rights do not reach it.
- **Pseudonymous data** (hashed but re-linkable to a person) **is still personal data**, is
  subject to deletion rights, and **cannot** be kept permanently against them.

Therefore the permanence the corpus needs is **only lawful if depersonalization is real.**
This is an **architecture requirement**, not a disclaimer: *anonymize at the source, never
store the link.* Store the judgments, never the judges.

---

## 1. What is stored — and what is never stored

**Stored (the anonymous corpus — retained indefinitely for research):**
- The machine's painted pieces and the secret prompts behind them.
- The names players submitted (captions only — see PII caution below).
- The machine's hidden guess each round.
- Flag choices, crown outcomes, speed/heat brackets, timestamps, model identifiers, app version.
- Round/session structure (player *count*, not player *identity*).

**Never stored / never sent to the server:**
- Player names entered at setup — these are **display labels for the night only**, held in
  device memory and discarded when the session ends.
- Any account identifier tied to round data.
- IP addresses retained against game data, precise location, device fingerprints.

**PII caution (the one residual risk):** a free-text caption *could* contain personal info a
player types. Mitigations: a setup notice asking players not to enter personal information;
an automated scrub pass before a row joins the permanent corpus; the no-PII norm stated in
the Constitution.

---

## 1A. Class A PII & likeness — the no-faces firewall

The most sensitive category — **Class A PII: faces, likenesses, and identifiable real
people** — is **disallowed by design.** The machine paints things, creatures, scenes, and
objects, never identifiable persons; players may not prompt for real people or celebrities.

This is a multi-layer firewall, not a courtesy:
- **Right of publicity.** A person's likeness — a celebrity's especially — is a property
  right (strong in California, among others). Generating or printing it unlicensed is a
  violation; printing it on merch is the textbook case.
- **Biometric / special-category data.** A recognizable face is biometric-adjacent — special
  category under GDPR, sensitive PI under CPRA, and regulated outright in some states.
- **Deepfake / synthetic-likeness exposure.** Real faces are exactly the conduct emerging
  synthetic-media laws target.
- **POD survival.** Print-on-demand vendors reject celebrity likenesses and infringing
  imagery and **ban accounts** for it. No faces keeps the POD relationship alive.

**Enforcement is at the engine, not the disclaimer.** Like the no-porn rule, the firewall is
the machine **refusing to paint** real faces or public figures — instructed at generation,
not merely promised in text. Captions are scrubbed for real names before printing, and a
human clears every print before fulfillment (only humans decide what ships).

## 2. The Constitution clause (add to the in-game agreement)

> **VI. No faces, no famous.** The machine paints things, not people — no real faces, no
> celebrities, no public figures. A likeness is a right that isn't yours to spend.
>
> **VII. The record.** This table keeps a depersonalized record of what was *made* and
> *judged* — the pieces, the names, the verdicts, the timing — and never *who you are.*
> The names you type are labels for the night, not data we keep. The anonymous record may be
> studied and kept indefinitely. Don't put personal information in a caption. Agreeing to
> play is agreeing to the record.

This places consent **before** collection (GDPR Art. 6/7; CCPA notice-at-collection) and is
gated by the existing 18+/Constitution checkbox.

---

## 3. Data & Privacy Notice (draft public text)

**What we collect.** When you play, we keep an *anonymous* record of each round — the
machine's piece, the names submitted, the machine's guess, the flags, the outcomes, and
timing. We do **not** keep your name, account, IP, or anything that identifies you.

**Why.** To run the game, and to build an anonymous research record of how people tell
human-made from machine-made work over time. Anonymous records may be studied, published in
aggregate, or shared with researchers.

**How long.** Anonymous round data is kept **indefinitely** — because it cannot be linked to
you, there is nothing personal to delete.

**Your choices.** Because the record is anonymous, we cannot find "your" rows to show or
delete them — that is the point of anonymizing at the source, and we disclose it plainly.
Any limited personal data handled *during a live session* (e.g., display names in device
memory) is yours to access or remove for as long as it exists, which is the session only.

**We do not sell or share your personal information** as those terms are defined under
California law, and we serve no advertising.

---

## 4. Cookie Notice (draft — essential-only recommended)

**Recommendation: use no non-essential cookies at all.** No analytics, no advertising, no
third-party trackers. This removes the consent-banner requirement (beyond a short notice) and
eliminates the CPRA "sharing" opt-out problem by simply not collecting trackable data.

**Draft text (essential-only model):**
> This site uses only **strictly necessary** cookies/local storage required to run the game
> (e.g., your session and settings). We set no analytics, advertising, or tracking cookies,
> and we share nothing with advertisers. Because we use no non-essential cookies, there is
> nothing here to opt out of.

**If non-essential cookies are ever added:** a GDPR/ePrivacy-grade banner is then required —
prior, granular, opt-*in* consent (nothing pre-ticked; reject as easy as accept) — plus a
CPRA "Do Not Sell or Share My Personal Information" / "Limit" mechanism. Avoiding this is the
cleaner path.

---

## 5. GDPR alignment checklist

- [ ] **Lawful basis** documented (consent for the record; legitimate interest / contract to
      run the game).
- [ ] **Anonymization is irreversible** (no stored re-link key) — verified, not assumed.
- [ ] **Data minimization & purpose limitation** — collect only the listed fields; state the
      research purpose up front.
- [ ] **Consent before collection** (Constitution clause), freely given, specific, informed,
      withdrawable; 18+ gate already present.
- [ ] **Storage limitation** satisfied *because* the retained corpus is anonymous (out of scope).
- [ ] **Data-subject rights** honored for any personal data handled during a session.
- [ ] **No special-category data** solicited; PII-in-captions scrub + warning in place.
- [ ] **Records of processing** and a privacy policy URL published.

## 6. CCPA / CPRA alignment checklist

- [ ] **Notice at collection** at or before the point of collection (Constitution + notice).
- [ ] **Deidentified-data commitment** — public statement that you will not attempt to
      reidentify, plus technical/process safeguards (this keeps the corpus out of scope).
- [ ] **No sale / no share** stated; no targeted-ad cookies.
- [ ] **Consumer rights** (know/delete/correct/limit) honored for any personal data; explain
      that anonymous data has none to act on.
- [ ] **"Do Not Sell or Share" / "Limit"** link only if any sharing exists (goal: none).

---

## 7. Build-now requirements (true before the first round played for keeps)

1. **Anonymize at the source.** Round data leaves the device already stripped — no name, no
   id, no re-link key ever written.
2. **Names never persist.** Setup names live in memory; gone at session end.
3. **Consent gate precedes collection.** No row is recorded for keeps until the Constitution
   (incl. Article VI) is accepted.
4. **No non-essential cookies** unless and until a full consent stack is built.
5. **Caption PII scrub + warning** before any caption joins the corpus.
6. **Schema versioning + immutable timestamps** so the historical record has provenance.

## 8. Open for counsel

- Whether your operations meet CCPA/CPRA business thresholds (changes some obligations).
- Jurisdiction-specific children's rules (the 18+ gate is the floor, not the whole answer).
- Whether "research / publication" purposes need their own explicit consent line.
- Data-processing-agreement terms with any backend/image vendor that briefly touches data.
- The exact reidentification-risk standard your anonymization must meet to qualify.
