# Cherry Edu Teams — Mentorship Loop Mobile Slice
**Product checkpoint · 2026-10-16**

Branch: \`feat/mentorship-loop-mobile-v1\`
Entry: \`/mentor-loop\` (preview-only; middleware denies access to this route on Vercel production)
Parent prototype remains available at \`/experience-lab\`.

## Hypothesis

The existing role pages and v3 experience lab overexpose administrative structure and display decorative journeys. A better product starts with a **single, end-to-end service event**:

**Trainer publishes real session and gives one practice assignment → Barista performs and submits a structured observation → Trainer gives actionable, published feedback → Owner sees published service evidence and next action.**

For this first slice, the event uses fictional customer \`Kopi Senja\`, fictional learner \`Naya Putri\`, and demo session \`Teknik Dasar & Espresso\`. It is an interactive UX prototype, **not a live tenant, not an authenticated training record, not a formal competency assessment**, and cannot be represented as a real delivered service.

## Removed from core screen

- Big decorative hero panels taking the initial mobile viewport.
- General checklist with no daily/date semantics.
- Self-reported "I learned" marks posing as educational progress.
- Fake course/final exam percentages.
- Long, duplicated learning-path maps on the home screen.
- Arbitrary random quiz as the homepage call-to-action.
- Single big note input directly shared with the Owner without a publication distinction.
- Numerical improvement and competencies not backed by comparable assessment.

## What works in preview

### Trainer
1. Marks the fictional learner present.
2. Records the real-world session topic.
3. Writes confidential private observations (hidden from Owner).
4. Writes the explicit **Owner-safe published summary**.
5. Assigns a meaningful practice prompt.
6. Publishes the service record once all required fields are valid.
7. Reviews submitted practice and chooses **Coba lagi** / **Berkembang** with concrete feedback.
8. Cannot silently edit a published session/review via the prototype.

### Barista
1. Sees the current task and programme context on mobile.
2. Recognises that online Fundamental content and its exam live in the B2C Cherry Edu platform; the preview does NOT fabricate progress sync.
3. Receives the practice prompt only after Trainer publishes the session.
4. Sends three structured reflections: what changed, what was noticed, why.
5. Sees honest waiting-feedback status.
6. Receives reviewed feedback.
7. Can retry **only when Trainer explicitly asks to try again**, retaining history. A "Berkembang" review does not confer verified competency.

### Owner
1. Sees R&D as **not recorded** instead of falsely completed.
2. Sees the Mentorship session only after Trainer publishes it.
3. Sees session topic, attendance, approved service summary and timestamps.
4. Sees count of submitted activities and reviewed feedback.
5. Sees published coaching and next action.
6. Never sees Trainer's internal observations, unpublished drafts, or Barista's raw practice responses.
7. Sees the final owner report as not published.

## How to try the full loop
1. Enter \`/mentor-loop\` preview.
2. In **Pelatih**, mark attendance, enter session topic, publishable Owner summary and Barista instruction. Click **Publikasikan sesi**.
3. Switch to **Barista**. Complete all three practice text fields and click **Kirim latihan**.
4. Return to **Pelatih**. Read submitted response. Choose **Coba lagi**, write actionable feedback, click **Kirim feedback**.
5. Return to **Barista**. Read feedback and try another submission. Prior attempt remains in history.
6. Switch to **Owner**. See only published observations and reports; incomplete phases remain incomplete.
7. Reload page; current simulation state should persist in browser localStorage.
8. Reset the simulation through the footer after confirming.

## Actual scope boundary

| Capability | Current preview | Real-product requirement |
|---|---|---|
| Role context | Role switcher for simulation only | Server-verified Supabase session / role |
| Persistence | Local browser only | Authenticated, tenant-isolated Postgres |
| Attendance | Preview self-report | Audited Trainer session and roster |
| Assessment | Qualitative practice feedback | Versioned rubric, assessor authority, evidence |
| Fundamental progress | Honest "not synced" state | Authenticated B2C path + exam adapter |
| Offline evidence | Trainer draft and published summary | Real session timestamps, attachments, participants |
| Owner report | Dynamic approved summary | Versioned auditable report with optional export |
| Connectivity | Browser-local state | Save drafts, retry, conflict management, offline support |
| Actual service | Only demo of one event | R&D, Teknik, Espresso Base, 3 paths, hybrid exam, final report |

## Test gates

**Gate A (pure domain contract):** 12 tests in \`tests/mentor_loop.test.ts\`, covering illegal transitions, published content protection, learner submission, trainer review, retry, owner-safe projections, corrupt storage, long inputs. CI required PASS.

**Gate B (compilation):** \`npm run typecheck\`, Next.js build required PASS. Vercel Preview required READY.

**Gate C (mobile human verification):** Real device or Playwright screenshots at 320/375/390/430/768/1440 widths. Focus on direct task discovery, contrast, scrolling, tap targets, error handling, progress transitions, and role context. **NOT PASS without actual screenshots / interactions.**

**Gate D (real multiuser integration):** Server-authoritative tenant/role-authenticated staging API and database, B2C canonical progress adapter, real owner published data and negative cross-tenant tests. **NOT IN SCOPE of this preview; not PASS.**

**Gate E (Product Owner UX acceptance):** Explicit owner review of the interactive screen and workflow, required before integration. **NOT SELF-APPROVABLE.**

Existing production login demo-role bypass and demo fixture fallback in existing role/API files remain **separate P0 blockers**. This slice does not repair them and must NOT be merged as a substitute.

Do not deploy to production, modify production Supabase, merge this draft, or alter the existing B2C site without explicit approval.
