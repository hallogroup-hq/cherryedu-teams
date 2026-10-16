# Cherry Edu Teams — 1-Month Coffee Shop Development Service
**Product direction / UX and data contract revision — 2026-10-16**

Status: **Product Owner business requirements accepted; engineering implementation pending.** This file documents approved scope and proposed acceptance criteria. It is not evidence that production integrations work.

## 1. North star

Cherry Edu Teams is a **mobile-first service-delivery and team-development companion** for coffee businesses commissioning a roughly one-month Cherry Edu training service. It is **not a replacement LMS** for edu.cherrycoffeeroastery.com.

A successful pilot lets:
- **Barista:** understand today's assigned activity; open the correct material on the main Cherry Edu site; see authenticated progress including final-exam outcome; attend practical training; understand feedback; continue study after the service month if entitled.
- **Owner:** know what Cherry Edu has actually done, what is planned, what their employees have learned, what evidence exists, what has or has not improved, and what action comes next.
- **Trainer:** log auditable on-site R&D findings and offline Teknik/Espresso Base activities, record attendance, practical assessments and individualized feedback on a phone, and assemble official hybrid exams.
- **Admin:** configure clients, assigned staff, program versions, mapping to published B2C paths, session schedules, exam blueprint, report publication and permissions.

## 2. Service delivery vs lifelong learning — a fundamental separation

**One-month service period** and **individual educational progress** are distinct timelines. A monthly engagement can reach "service delivered / report published" while Fundamentals, three elective paths or their final exams are *still in progress*. Do NOT declare a learner or training program fully completed from an elapsed date.

Track independently:
1. **Service execution:** R&D → hybrid mentoring sessions / assignments → owner report, with date, responsible person, status, deliverables.
2. **B2C learning:** real path enrollment, authenticated lesson/module/final-exam progress, timestamp, canonical path version.
3. **Offline practice:** trainer session, attendance, observation, evidence, remediation, reassessment.
4. **Formal qualification:** exam attempt, published assessment criteria, authorised practical signoff. Quiz pass or attendance alone never equals competency.

Potential lifecycle: **Preparation** → **Active service** → **Service closing / report** → **Continued learning / follow-up** (per contract/policy). Avoid hidden automatic access expiration or false 100% completion.

## 3. Actual service package (the exact stages requested)

### A. R&D (owner-visible, Trainer/Admin-produced)
- Initial needs check: coffee business type, outlets, size, equipment, staff experience, operational constraints, target outcomes.
- Bar audit: counter flow, prep/service workflow, dial-in approach, recipe consistency, equipment condition, hygiene/SOP, relevant service bottlenecks.
- Record baseline observations: when/where/who, factual findings, impacts, recommended actions, optional photos/evidence stored privately.
- Distinguish **observed**, **recommended**, **approved**, and **implemented**, never automatically mark recommendations as completed.
- Report visible to Owner with plain-language implications; protect internal consultant notes/pricing.

### B. Hybrid Mentorship
**2.1 Fundamental (B2C online)** — two required educational paths:
- "Fundamental: Hulu ke Hilir".
- "Fundamental Barista / Barista Path".
- Actual material, quizzes, and final exam live at **edu.cherrycoffeeroastery.com**. Teams provides a **deep-link and read-only authenticated progress/status projection**, not lesson duplication. Avoid guessed slug/IDs; resolve the canonical path IDs and endpoints from B2C source of truth.
- Track: assigned, not started, in progress, final exam not taken, final exam passed/failed, last synced, source version. Do not accept a client-declared "finished" as official.

**2.2 Teknik (offline)** — practical, onsite instruction.
- Session date, trainer, location, attendance, what was taught, demonstration/practice, observed issues, actionable feedback, evidence, next practice.
- Sample topics: bar workflow, safe preparation, puck preparation/distribution/tamping, workflow consistency (actual scope approved by Trainer).

**2.3 Espresso Base (offline)** — practical, onsite instruction.
- Dial-in principles, tasting, controlled variable changes, consistency, sensory reasons; log equipment and practical context where useful.
- Preserve distinct sessions, records, assessment evidence and feedback. No fabricated scores.

**2.4 Class (online, minimum three paths)**.
- At least three **distinct published Cherry Edu paths** assigned/selected based on coffee-shop needs; each links back to the actual B2C platform.
- Distinguish **assigned** vs **started** vs **passed final exam**. Do not claim "3/3 completed" merely from three selections.
- A learner may study beyond the first month depending on contractual access/entitlement policy.

**2.5 Hybrid final exam**.
- Assemble from **approved, versioned official B2C questions** aligned to assigned/published curricula **plus Trainer-authored questions** about offline practice.
- Builder requires source provenance, explicit coverage/blueprint, question type and valid answer keys/marking rubric, publish review, permissions, version lock, question snapshots and attempt integrity.
- Objectivity: online auto-grade only for well-defined question types; open-ended/manual cases require authorised marking. Never auto-grant "competent" from hybrid theory alone.
- Passing threshold/weighting/retake policy remain configurable and subject to Product Owner / educational approval. Do not invent percentage or imply SCA certification.

### C. Owner Report (visible while service happens; final snapshot at closure)
It must answer "**Apa yang tim Cherry Edu kerjakan, apa yang barista pelajari, dan apa dampaknya?**" without making the owner ask separately.

Sections:
1. **Engagement summary** — time window, outlet(s), contracted scope, current milestone and next activity.
2. **Service delivered** — R&D outputs and findings, Teknik/Espresso Base session log, topic, trainer, attendance, date, relevant evidence links, status.
3. **Online learning** — two Fundamentals plus three selected paths per learner; final exam results from authoritative B2C status; stale sync must say "belum tersinkron", not 0% or finished.
4. **Practical skill development** — baseline and follow-up of the *same versioned criteria*, actual evidence and authorised observation. If no comparable measurements exist, state "belum ada pengukuran pembanding".
5. **Per-employee narrative** — strength, area for practice, completed sessions, next best training action, upcoming assessment.
6. **At service closure** — what was delivered vs planned, blockers, unresolved learning, who owns follow-up, how learning can continue.
7. **Export** — snapshot PDF/CSV where required by approved blueprint, with timestamp, program version, generated-by, access restrictions.

Owner reports do **not** include raw confidential trainer deliberation, other tenants, or the entire private individual B2C learning history. They display only the B2B-assigned learning scope.

## 4. Mobile-first IA

A 320–430px device is the primary environment for Barista and Trainer:
- **Barista:** Home / Today → Learning Journey → External Cherry Edu path (return to Teams) → practical feedback → progress.
- **Owner:** Service Today → What Cherry Edu Did → My Team → Individual Growth → Final Report. Do not lead with generic KPI cards.
- **Trainer:** Today / Session → Participants → record attendance & observed evidence → practical assessment → review → auditable publish/hand-off. One salient action per screen, touch targets >=44px and readable body >=14–16px.
- **Admin:** client setup/contract scope, session planner, path mapping, exam builder, report review/publish, access audit; avoid unnecessary new navigation or duplicated B2C billing dashboards.

A friendly experience comes from clear next actions, meaningful feedback, low-friction forms, and contextual practice. Avoid gratuitous gamification, fake leaderboards, or treating completion as skill.

## 5. Non-negotiable integration architecture

B2C is the **canonical source of truth** for content, path identity, quizzes, exam attempts/outcomes, and validated material. B2B stores assignment, context, read-only derived snapshot, sync history, and delivery/assessment records.

Design an authorised server-to-server progress adapter using the same verified user identity:
- canonical B2C user ID → B2B org membership → assigned path IDs and versions;
- fetch only authorised progress and final exam results;
- handle no entitlement, no enrollment, cross-subdomain authentication, version changes, retry errors, backfill and sync staleness;
- preserve learning after a service month without promising indefinite access;
- never use localStorage, user cookies declaring roles, screenshots of progress, or client-supplied completion flags as authority.

Actual B2C endpoint shapes, table schema and stable path identifiers must be verified before integration. A link to /paths alone does not prove real progress sync.

**Avoid accidental billing coupling.** B2C optimistic QRIS/Pro access business rules are separate from B2B training service payment/contracts unless approved explicitly.

## 6. Gate requirements (NO VERIFIED PASS = NO ADVANCE)

### Gate UX-1 (prototype and design)
- Four-part mentorship sequence shown clearly on Barista mobile.
- 3 service deliverables shown clearly to Owner with useful proof, not KPI bloat.
- Trainer can simulate writing a session note and see it on Owner's example report without a server mutation.
- Links to B2C are honest, not guessed deep-links.
- Preview is visibly labeled simulated, routes gated from production and existing role pages unchanged.
- Product Owner explicitly approves the visual direction. Until then, **NOT PASS**.

### Gate DATA-1 (B2C sync)
- Both required Fundamentals and three elective paths resolve to verified canonical IDs.
- Authenticated B2C progress/final exam passes appear accurately for correct learner and version.
- No result leakage across organizations; errors/stale data stated honestly.
- Refresh, login restoration, and week-month service transitions work.
- Supabase staging + real Next.js integration tests pass. **NO mock-only PASS.**

### Gate OFFLINE-1 (Trainer field service)
- Trainer records attendance, session topic, timeline, findings, follow-ups; data persist and are audited; staff assignment checked.
- Offline notes shared only through approved report disclosure; unauthorized tenant request fails.
- Interrupted network, draft/retry, offline conflicts tested on mobile.
- Rubric version, evidence and final signoff guarded separately.

### Gate EXAM-1 (hybrid assessment)
- Verified B2C question provenance plus authorised manually authored questions.
- Validated answers, published exam version, grading/attempt policy, score/response access, no answer leakage or forged completion.
- Passing an exam does not automatically mark practical competency verified.
- Educational approval of new original material.

### Gate REPORT-1 (Owner)
- Every delivered activity has attributable timestamp and evidence/attendance where relevant.
- Learner B2C progress is canonical and scoped; no fake increase metrics.
- Report differentiates **done**, **scheduled**, **blocked**, **learning continues**.
- Owner can tell what Cherry Edu delivered and what remains without extra support inquiries.
- Final report snapshot/version/access/exports tested.

### Gate RELEASE
- Strict security auth (NO demo-role bypass in deployment).
- Mobile real-browser screenshots at 320/375/390/430 and desktop.
- Real role E2E, negative tenant tests, build/typecheck, zero unresolved P0/P1.
- Staging product review approved. No production deploy without separate permission.

## 7. Research references and interpretation

- Specialty Coffee Association, Coffee Skills Program: authorised coffee education blends hands-on/remote training and practical/written assessment. **Do not claim Cherry Edu courses automatically grant official SCA certificates.** https://education.sca.coffee/coffee-skills-program
- CIPD, Learning evaluation, impact and transfer (2025): evaluation should tie learning to actual performance gaps. https://www.cipd.org/uk/knowledge/factsheets/evaluating-learning-factsheet/
- CIPD, Role of line manager in skills development (2025): workplace learning requires management support and opportunity to practise. https://www.cipd.org/en/views-and-insights/thought-leadership/insight/learning-value-role-manager/
- CDC, Measuring Training Effectiveness: delayed follow-up gives better evidence of on-the-job transfer than post-course reaction alone. https://www.cdc.gov/training-development/php/about/evaluate-training-measuring-effectiveness.html
- Carpenter, Pan & Butler, Nature Reviews Psychology (2022): spaced practice and retrieval practice are supported learning strategies, appropriate for optional short challenges and practice reminders. https://doi.org/10.1038/s44159-022-00089-1

## 8. Decisions for Product Owner review, not made unilaterally

1. Precise contract service period and whether the final report covers 4 calendar weeks / 30 days / bespoke dates.
2. Whether "minimum 3 paths" means assigned, started, or passing final exams as a commercial delivery promise.
3. Hybrid exam weight, pass mark, allowed retries, and manual grading accountability.
4. Continuing platform access/learning entitlement after the service month.
5. Owner visibility and retention period for staff progress, per consent and client contract.
6. Whether R&D results include equipment/SOP consulting deliverables beyond training.

Do not block exploration on these questions; flag them before irreversible production schema/business policy or certification rules.

## 9. Prototype check-in

Route: /experience-lab — preview-only, fixture-based interactive service experience, no authenticated learning, no DB writes.
Status: UX direction experiment, NOT production implementation or QA PASS.
