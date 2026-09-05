# Project Worklog — SealedRecovery (Compliant Debt-Recovery Batch Orchestration)

This is the shared handover document for all agents working on this project.
Append new sections below; never overwrite existing content.

---
Task ID: 0
Agent: orchestrator (main)
Task: Bootstrap the compliant debt-recovery platform from a fresh Next.js scaffold and create the recurring webDevReview cron job.

Work Log:
- Read project root, confirmed fresh scaffold (only placeholder `src/app/page.tsx`, default Prisma schema with User/Post).
- Verified dev server running on port 3000 (200 OK).
- Created recurring `webDevReview` cron job (job_id 361690) firing every 15 minutes (fixed_rate 900s, tz Asia/Calcutta). Payload kind = `webDevReview`. The job prompt instructs the reviewer to read this worklog, QA via agent-browser, fix bugs first, then add features + styling detail.
- Designed and wrote the Prisma schema (`prisma/schema.prisma`) with 7 models: RecoveryBatch, Debtor, RecoveryAttempt, OptOutRecord, EscalationGate, StopRuleEvent, AuditEvent. Pre-registered holdout ratio on the batch; immutable opt-out registry; mandate-gated escalation gates; append-only audit log.
- Ran `bun run db:push` — schema synced to SQLite at `db/custom.db`.
- Wrote deterministic seed script (`prisma/seed.ts`): batch 1 (RUNNING, 60 debtors, 20% holdout) + batch 2 (SEALED, 40 debtors — sealed ground truth for meta-validation). Seeds recovery attempts, opt-out records, stop-rule events (incl. Hinglish phrases), escalation gates (some PENDING), and audit events. Added `db:seed` script to package.json. Ran it successfully.
- Dispatched the full dashboard UI build to a full-stack-developer subagent (Task 2-a) with a detailed spec covering all three pillars, the API contract, layout/accessibility/styling rules, and the sticky-footer requirement. (Subagent completed; see its own section below if appended.)
- Built all 10 API routes myself (Task 2-b) to match the frontend contract in `src/lib/dashboard-types.ts` + `src/components/dashboard/queries.ts`:
  - `GET /api/overview` — default RUNNING batch + KPIs (incremental rupees vs holdout, Wilson/mean CIs) + meta-validation vs sealed batch.
  - `GET /api/batches` — list with debtor counts + recovered totals.
  - `GET /api/escalation-gates?status=PENDING` — human-approval gate queue.
  - `POST /api/escalation-gates/[id]/approve` + `/reject` — promote/deny on the mandate-gated ladder, writes audit events.
  - `GET /api/stop-events?limit=20` — recent stop-rule events feed.
  - `POST /api/stop-rule` — the live stopping-rule path: detects en/hi/hinglish stop phrases, writes OptOutRecord + StopRuleEvent + AuditEvent, halts outreach.
  - `GET /api/compliance-rules?batchId=` — mandate level, quiet hours (21:00–08:00 IST), daily/total attempt caps, opt-out count, human-approval-from-rung, 4-rung ladder.
  - `GET /api/escalation-funnel?batchId=` — debtor counts per ladder rung.
  - `GET /api/holdout-comparison?batchId=` — treated vs holdout mean + CI.
  - `GET /api/recovery-distribution?batchId=` — 5-bucket recovery-% histogram, treated vs holdout.
  - `GET /api/audit?limit=50` — append-only audit log.
- Wrote shared stats + stop-rule detection library (`src/lib/recovery-stats.ts`): `wilsonCI`, `meanCI` (normal approx + small-sample t correction), `detectStopPhrase` (curated Hinglish/Hindi/English phrase lists + heuristics), ladder + compliance constants.
- Reduced Prisma client log level from `['query']` to `['error','warn']` to cut dev.log noise.
- Verified all GET endpoints via curl (valid JSON). Verified POST /api/stop-rule with Hinglish ("mujhe call mat karo" → STOP_HINGLISH, 99% confidence), English ("please stop calling me" → STOP_EN, 97.5%), and a non-match ("i want to pay" → ok:false). Verified approve via curl (DBT-001G → APPROVED).
- Ran `bun run lint` — clean.
- Verified end-to-end with agent-browser:
  - Page renders all 3 pillars with real data.
  - Pillar 1: Total Recovered ₹11,43,085 / 60 debtors; Incremental +₹6,57,005 (+168.9%); Wilson CIs shown; Meta-validation "Validated ✓" (estimate ₹4.52L vs sealed ₹4.85L, −6.8% within tolerance).
  - Pillar 2: 4-rung escalation ladder with per-rung counts + "Gate" badges on rungs ≥2; human-approval gate queue with Approve/Reject buttons; compliance rules panel (mandate STANDARD, quiet hours 21:00–08:00 IST, caps 3/day & 8/total, 9 opted-out, human gate from rung 2).
  - Pillar 3: Stop-rule simulator with quick-phrase buttons (incl. "mujhe call mat karo", "calls band karo", "ab phone mat karna", "chhodo mujhe"); clicked Hinglish button → "Outreach halted · HINGLISH · STOP_HINGLISH · 99%"; recent events feed shows Hinglish rows highlighted.
  - Escalation-gate Approve button: scrolled into view, clicked → POST 200 → gate removed from PENDING queue (DBT-001E approved). Confirmed round-trip works.
  - Sticky footer confirmed (`min-h-screen flex flex-col` wrapper + `mt-auto` footer), footer pushed down naturally on long content.
  - No runtime/hydration errors in dev.log.

Stage Summary:
- Project is a fully working compliant debt-recovery dashboard on the single `/` route. All three pillars (measured money recovered, compliant escalation, stopping rules incl. Hinglish) are functional end-to-end with real seeded data.
- 10 API routes implemented and verified. Frontend composed of 13 dashboard components under `src/components/dashboard/`.
- Lint clean. Dev server healthy. Recurring 15-minute webDevReview cron job active (job_id 361690).
- Artifacts: `prisma/schema.prisma`, `prisma/seed.ts`, `src/lib/recovery-stats.ts`, `src/app/api/**/route.ts` (10 routes), `src/lib/dashboard-types.ts`, `src/components/dashboard/*`, `src/app/page.tsx`, `src/app/layout.tsx`.

Unresolved issues / risks / next-phase priorities:
- Prisma uses SQLite (single file) — fine for demo; for scale, move to Postgres.
- No authentication / RBAC — the human-approval gate currently stamps "operator@console". Next phase: add NextAuth with agent roles and real approver identity.
- Stop-rule detection is phrase-list + heuristic; next phase: wire the z-ai-web-dev-sdk LLM for fuzzy/intent-based stop detection (e.g. "bas ab aur mat phone karna yaar") and ASR (z-ai ASR skill) to transcribe live calls before stop-rule matching.
- No real-time push (WebSocket) — the stop-events feed and gate queue poll via TanStack Query refetch. Next phase: add a socket.io mini-service so new stop events appear live without refetch.
- Charts: recovery-distribution could add an 80-100% bucket label fix (currently only 4 labels render due to axis spacing — cosmetic).
- Add a per-debtor drill-down drawer (debtor token → attempts timeline, opt-out history, audit trail).
- Add a "Seal batch" action that flips a RUNNING batch to SEALED (locks ground truth) + re-runs meta-validation.
- Consider adding a quiet-hours live clock that disables the "Halt outreach" / call actions when inside 21:00–08:00 IST.
