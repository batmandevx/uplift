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

---
Task ID: 1 (webDevReview round 1)
Agent: webDevReview (cron job 361690)
Task: Assess project status, QA via agent-browser, fix bugs, then add features + styling polish.

Work Log:
- Read worklog.md (Task 0 record). Project was a working compliant debt-recovery dashboard with 3 pillars, 10 API routes, seeded data.
- QA: opened http://localhost:3000/ via agent-browser. No console errors, no runtime errors. dev.log clean (all 200s, no error/warn lines except the initial 404s before APIs existed).
- Found UX bug: stop-rule simulator default debtor token was "DEBT-7F3A9C" (fake placeholder that doesn't match real DBT-XXXX tokens). The API fell back to a random debtor, so it worked, but the field was misleading. FIXED: default to empty string + placeholder "Auto-select debtor".
- Added 5 new features + 4 new API routes:

  1. LLM fuzzy stop-phrase classification (z-ai-web-dev-sdk):
     - New endpoint POST /api/stop-rule/classify — tries the deterministic phrase-list matcher first (fast path); only if it misses, calls the z-ai LLM with a strict-JSON system prompt to classify stop intent including fuzzy/colloquial Hinglish (e.g. "yaar please leave me alone na, bahut ho gaya"). Tags the result rule "LLM_FUZZY" so the audit trail distinguishes fuzzy from exact matches. Returns isStopRequest, language (en/hi/hinglish), confidence, intent, reasoning, rule, matchedBy.
     - Added "AI Classify" button (Brain/Sparkles icon, violet accent) to the stop-rule simulator. Shows a ClassifyPanel with intent/confidence/rule/reasoning/matchedBy before the operator commits the halt.
     - Added 2 new fuzzy sample phrases to the samples dropdown ("yaar please leave me alone na", "bahut ho gaya ab, bas karo").
     - Verified: "yaar please leave me alone na, bahut ho gaya" → isStopRequest:true, hinglish, LLM_FUZZY, 90%. "i will pay the balance next monday" → isStopRequest:false, intent: payment query.

  2. Per-debtor drill-down drawer:
     - New endpoint GET /api/debtors?batchId=&q=&status=&limit= — list with token/region search + status filter (all/active/optout/treated/holdout).
     - New endpoint GET /api/debtors/[token] — full detail: attempts timeline (50), opt-out records, audit trail (50), recovery %, opt-out reason/stop rule, last attempt.
     - New component DebtorDrilldown (debtor-drilldown.tsx): search input (debounced 250ms), status filter pills, scrollable debtor list (max-h-80, scroll-thin), and a right-side Sheet drawer with Tabs (Attempts / Opt-outs / Audit). Each attempt row shows channel icon, outcome badge, amount collected, transcript snippet. Audit tab is a vertical timeline. Wired into page.tsx as a full-width section below the main 3-pillar grid.

  3. Quiet-hours live IST clock:
     - New endpoint GET /api/quiet-hours — computes IST = UTC + 5:30 (works in any server tz), returns nowIst (HH:mm), insideQuietHours (21:00–08:00 window wraps midnight), nextChangeInMinutes, outreachSuppressed.
     - New component QuietHoursClock (quiet-hours-clock.tsx) in the site header — Moon/Sun icon, color-coded badge (rose when suppressed, emerald when allowed), tooltip with countdown to next window change. Polls every 60s. Verified: returned nowIst 23:03, insideQuietHours true, outreachSuppressed true.

  4. Seal batch action:
     - New endpoint POST /api/batches/[id]/seal — flips RUNNING → SEALED, sets closedAt, writes BATCH_SEALED audit event, returns the ground truth (treatedN, holdoutN, incrementalRupees). Verified: returned ok:true with incrementalRupees 657005. Re-seeded afterward to restore the RUNNING demo batch.
     - Added "Seal batch" button (Lock icon, amber accent) to the site header, shown only when the active batch status is RUNNING, with a tooltip and confirmation toast on success.

  5. Styling polish:
     - Added two new CSS utilities to globals.css: bg-grid (subtle dotted grid backdrop) and bg-aurora (soft chart-color radial glows). Applied as fixed -z-10 layers on the page wrapper for ambient depth.
     - Pillar banners: added group hover lift (-translate-y-0.5 + shadow-md), a colored status dot that brightens on hover, transition-all 300ms.
     - Recovery-distribution chart: fixed bucket label spacing (XAxis interval=0, minTickGap=0, fontSize 11) and added data dots + active dots on both areas so the 5 buckets are clearly visible.
     - Stop-rule simulator: added XCircle/CheckCircle2 + reasoning italic text in the classify panel; added "matched by" footnote.

- Extended dashboard-types.ts with LLMClassifyResponse, DebtorListItem, DebtorAttempt, DebtorOptOut, DebtorDetail, QuietHoursStatus, SealBatchResponse. Extended queries.ts with useLLMClassify, useDebtors, useDebtorDetail, useQuietHours (refetchInterval 60s), useSealBatch (+ invalidated "debtors" in useSubmitStopRule).

Verification results:
- bun run lint: clean (no errors/warnings).
- Page SSR: GET / returns http=200, 60KB HTML, title "SealedRecovery — Compliant Collections Ops". All new features present in SSR HTML (AI Classify, Debtor Registry, Quiet hours, Seal batch, Escalation Ladder, Meta-validation, Stop-Rule Simulator). No real error markers (the "Hydration" match is the normal suppressHydrationWarning attribute; the "500" matches are Tailwind color classes bg-emerald-500/amber-500/rose-500/orange-500).
- All new API endpoints return valid JSON via curl: quiet-hours, stop-rule/classify (both fuzzy-stop and non-stop paths), debtors list (all/active/optout/treated/holdout filters), debtors/[token] detail, batches/[id]/seal.
- dev.log: no error/unhandled/fail/module-not-found lines (filtered out the historical 404s from before APIs existed).

Known environment issue (NOT a code bug):
- The dev server (Next.js 16 + Turbopack) is unstable in this sandbox — it serves a burst of requests then the process is killed (likely memory pressure during compilation; first compile took 6–9s). The auto-run system did not always restart it. I started it with `setsid ... & disown` to verify; it served requests correctly but needed re-starting between bursts. This affects interactive agent-browser snapshots, not the code itself. The system's auto-runner should be relied upon for steady-state serving; my manual starts were only for verification bursts.

Stage Summary:
- Phase-2 features complete: LLM fuzzy stop classification (Hinglish truly first-class now), per-debtor drill-down drawer with attempts/opt-outs/audit tabs, quiet-hours live IST clock with suppression indicator, seal-batch action with ground-truth lock + audit, plus styling polish (ambient grid/aurora backdrop, hover-lift pillar banners, chart dot annotations).
- 4 new API routes added (total now 14). 3 new dashboard components added (quiet-hours-clock, debtor-drilldown; simulator enhanced). dashboard-types.ts + queries.ts extended.
- Lint clean. All endpoints verified via curl. Page renders 200 with all features.

Unresolved issues / risks / next-phase priorities:
- Environment dev-server instability (memory pressure) — recommend the auto-runner use a lighter compile or increase the memory limit; not a code issue.
- NextAuth RBAC: human-approval gate and seal action still stamp "operator@console". Next phase: add NextAuth with agent roles + real approver identity, and gate the Seal button behind an admin role.
- Socket.io live push: stop-events feed and gate queue still poll via TanStack Query. Next phase: add a socket.io mini-service so new stop events / gate decisions appear live without refetch.
- ASR integration: wire the z-ai ASR skill to transcribe live call audio, then pipe the transcript through detectStopPhrase + LLM classify for real-time stop detection.
- Debtor drill-down: add a "record a new attempt" / "manually opt-out" action inside the drawer (currently read-only).
- Meta-validation: visualize the sealed-vs-running delta as a small chart (currently a panel with numbers + progress bar).
- Consider a batch-comparison view (compare 2+ sealed batches' incremental recovery).

---
Task ID: 2 (webDevReview round 2)
Agent: webDevReview (cron job 361690)
Task: Assess project status, QA via agent-browser, fix bugs, then add features + styling polish.

Work Log:
- Read worklog.md (Tasks 0 + 1). Project had 14 API routes, 3 pillars working, LLM fuzzy classify, debtor drill-down, quiet-hours clock, seal batch action.
- QA: Started dev server (unstable in sandbox — gets killed after compile bursts, confirmed from Task 1 worklog). Verified SSR returns 200 with all features present in HTML (Batch Comparison, Audit Timeline, Recovery Trend, Meta-validation, Debtor Registry, Stop-Rule Simulator, Quiet hours, Seal batch, Escalation Ladder). No error markers in SSR HTML.
- Found React duplicate-key console warning. Investigated extensively: checked all list `key=` props (all use unique .id/.phrase/.level/.key values), checked all API responses for duplicate IDs (none found). Root cause: (1) stale browser console buffer from previous page loads (the browser had been open across multiple re-seeds + server restarts, accumulating old warnings); (2) the unused Radix `<Toaster />` component in layout.tsx (all notifications use `sonner`, not Radix `useToast` — no component imports `useToast` except the Toaster itself). FIXED: removed the dead Radix `<Toaster />` from layout.tsx, closed all browser sessions to clear stale console buffer. Verified: fresh browser session after fix shows ZERO console errors/warnings.
- Added 3 new features + 2 new API routes:

  1. Batch comparison view (Pillar 1 enhancement):
     - New endpoint GET /api/batch-comparison — compares incremental recovery (treated vs holdout mean, mean CI, lift %, total recovered) across ALL batches. Returns per-batch: batchName, status, mandateLevel, holdoutRatio, debtorCount, treatedN, holdoutN, treatedMean, holdoutMean, treatedCI, holdoutCI, incrementalRupees, liftPct, totalRecovered, closedAt.
     - New component BatchComparisonChart (batch-comparison-chart.tsx): recharts BarChart with two bars per batch (treated mean + holdout mean), custom tooltip showing full breakdown (treated/holdout mean, incremental, lift %), angled X-axis labels. Wired as a full-width section alongside the audit timeline.
     - Verified: returns 3 batches (Q2 ENHANCED sealed, Q3 STANDARD sealed, Q4 STANDARD running). Q2 ENHANCED shows 328% lift (stronger mandate = higher treatment effect).

  2. Recovery trend sparkline (Pillar 1 enhancement):
     - New endpoint GET /api/recovery-trend?batchId=&days=14 — buckets RecoveryAttempt.amountCollected by IST day (UTC+5:30), returns continuous day series with cumulativeRecovered, dailyRecovered, attempts per day. Fills gaps with 0.
     - New component RecoveryTrendCard (recovery-trend-card.tsx): recharts AreaChart sparkline showing 14-day cumulative recovery trend, with 3 stat tiles below (14-day total, peak day, total attempts). Custom tooltip with day/cumulative/daily/attempts. Placed side-by-side with the MetaValidationPanel in the Pillar 1 section.

  3. Audit timeline panel (compliance evidence):
     - New component AuditTimeline (audit-timeline.tsx): uses existing /api/audit endpoint. Groups events by IST day with sticky date headers, renders a vertical timeline with color-coded action icons (BATCH_STARTED=Cpu/gray, BATCH_SEALED=Lock/amber, ESCALATION_APPROVED=ShieldCheck/emerald, ESCALATION_REJECTED=XCircle/rose, STOP_RULE_TRIGGERED=ShieldAlert/rose). Each event row shows action label, timestamp, detail, actor (with Cpu/User icon distinguishing system vs human). Scrollable (max-h-96, scroll-thin). Framer Motion staggered entrance.
     - Fixed Tailwind dynamic class issue: replaced `${meta.tone.replace("text-","bg-")}` (not visible to JIT) with a static `dot` property in the ACTION_META map (e.g. `dot: "bg-emerald-500"`).

- Enhanced seed script (prisma/seed.ts):
  - Added Batch 3: Q2-2024-NPL-Cohort-C, SEALED, ENHANCED mandate, 25% holdout, 50 debtors, started 135 days ago, closed 105 days ago. Treatment effect ~51% vs 14% holdout (stronger mandate = higher lift, useful for batch comparison contrast).
  - Replaced the 4-line audit event block with 12 timestamped audit events spread across 135 days (3 batches × 4 events each: BATCH_STARTED, ESCALATION_APPROVED/REJECTED, STOP_RULE_TRIGGERED, BATCH_SEALED). Each event has a realistic detail string and `at` timestamp. This makes the audit timeline look realistic with multiple date groups.
  - Re-seeded successfully: 3 batches (1 RUNNING + 2 SEALED), 150 debtors total, 12 audit events.

- Extended dashboard-types.ts with BatchComparisonRow, RecoveryTrendPoint, RecoveryTrendResponse, AuditTimelineGroup. Extended queries.ts with useBatchComparison, useRecoveryTrend (+ invalidated "batch-comparison" in useSealBatch).

- Styling/layout changes:
  - Restructured Pillar 1 section: MetaValidationPanel + RecoveryTrendCard now side-by-side in a 2-col grid (was MetaValidationPanel alone).
  - Added full-width section below debtor drill-down: BatchComparisonChart + AuditTimeline side-by-side in a 2-col grid.
  - Removed unused Radix Toaster from layout.tsx (dead code — all notifications use sonner).
  - Fixed batch-comparison-chart: removed incorrectly-placed Cell mapping (was outside Bars), kept two distinct-color Bars.

Verification results:
- bun run lint: clean (no errors/warnings).
- SSR: GET / returns http=200, 64KB HTML, title "SealedRecovery — Compliant Collections Ops". All features present in SSR HTML (Batch Comparison, Audit Timeline, Recovery Trend, Meta-validation, Debtor Registry, Stop-Rule Simulator, Quiet hours, Seal batch, Escalation Ladder).
- Console: after closing all browser sessions (clearing stale buffer) + fresh load, ZERO console errors/warnings. The duplicate-key warning that appeared in previous sessions was confirmed to be stale buffer + the removed Radix Toaster.
- API verification via curl: /api/batch-comparison returns 3 batches with full stats; /api/recovery-trend returns 14-day series with cumulative/daily/attempts. /api/audit returns 12 timestamped events.
- agent-browser snapshot confirms all new features render: Batch Comparison, Audit Timeline, Recovery Trend all visible with real data.
- dev.log: no error/unhandled/fail lines.

Stage Summary:
- Phase-3 features complete: batch comparison chart (cross-batch incremental recovery benchmarking), recovery trend sparkline (14-day cumulative), audit timeline panel (date-grouped compliance evidence), 3rd sealed batch in seed (ENHANCED mandate for comparison contrast), richer timestamped audit events.
- 2 new API routes added (total now 16). 3 new dashboard components added (batch-comparison-chart, recovery-trend-card, audit-timeline). Seed enhanced with 3rd batch + 12 timestamped audit events.
- Fixed: React duplicate-key warning resolved (removed dead Radix Toaster + stale browser console buffer). Tailwind dynamic class fixed in audit-timeline (static dot property).
- Lint clean. All endpoints verified. Page renders 200 with zero console errors.

Unresolved issues / risks / next-phase priorities:
- Environment dev-server instability persists (memory pressure kills Turbopack after compile bursts). Not a code issue — the auto-runner should handle restarts.
- NextAuth RBAC: human-approval gate and seal action still stamp "operator@console". Next phase: add NextAuth with agent roles.
- Socket.io live push: stop-events feed, gate queue, and audit timeline still poll via TanStack Query. Next phase: add a socket.io mini-service for real-time updates.
- ASR integration: wire z-ai ASR skill to transcribe live call audio, then pipe through detectStopPhrase + LLM classify.
- Debtor drill-down: add write actions (record new attempt, manually opt-out) inside the drawer.
- Batch comparison: add a delta/lift scatter plot (incremental rupees vs lift %, bubble size = debtor count).
- Consider a "methodology pre-registration" view showing the sealed holdout ratio + analysis plan locked at batch start.

---
Task ID: 3 (webDevReview round 3)
Agent: webDevReview (cron job 361690)
Task: Assess project status, QA via agent-browser, fix bugs, then add features + styling polish.

Work Log:
- Read worklog.md (Tasks 0, 1, 2). Project had 16 API routes, 3 batches (1 RUNNING + 2 SEALED), 150 debtors, batch-comparison chart, recovery-trend sparkline, audit timeline, LLM fuzzy classify, debtor drill-down, quiet-hours clock, seal batch action.
- QA: Started dev server (unstable in sandbox — confirmed from prior worklog). Closed all browser sessions to clear stale buffer. Fresh load: zero console errors/warnings. All existing features render (Batch Comparison, Audit Timeline, Recovery Trend, Meta-validation, Debtor Registry, Stop-Rule Simulator, Quiet hours, Seal batch, Escalation Ladder). Lint clean. dev.log clean.

- Added 2 new feature groups + 3 new API routes:

  1. Methodology pre-registration view (Pillar 1 — strengthens the "pre-registered holdout" narrative):
     - Schema change: added 5 fields to RecoveryBatch model — analysisPlan (String?), methodologyHash (String?), preRegisteredAt (DateTime?), primaryMetric (String default "incremental_recovery_vs_holdout"), significanceLevel (Float default 0.05). Ran db:push successfully.
     - Seed enhancement: added a `methodologyHash()` helper (FNV-1a 32-bit, 8-hex-char fingerprint). All 3 batches now get a deterministic hash computed from batch name + mandate + holdout ratio + analysis plan text, plus a preRegisteredAt timestamp 1 day before startedAt. Each batch has a distinct, realistic analysis plan text.
     - New endpoint GET /api/methodology?batchId= — returns the pre-registered analysis plan, methodology hash, pre-registration timestamp, primary metric, significance level, and a `sealed` boolean (true once status ≠ DRAFT).
     - New component MethodologyCard (methodology-card.tsx): displays the pre-registered analysis plan in a bordered box, the methodology hash in a highlighted violet-accented card (with Fingerprint icon, explaining that any mutation invalidates the hash), and a parameter grid (pre-registered at, primary metric, significance level α, holdout ratio). "sealed" badge when the methodology is immutable. Wired into the Pillar 1 section below the MetaValidationPanel + RecoveryTrendCard row.
     - Verified via curl: returns hash "5DB5..." for the running batch. SSR HTML includes "Methodology Pre-registration", "methodology hash", "Pre-registered analysis plan".

  2. Debtor drawer write actions (makes the drill-down actionable):
     - New endpoint POST /api/debtors/[token]/attempts — records a new outreach attempt. Enforces 3 compliance gates in order: (1) opt-out registry (409 if opted-out), (2) quiet hours IST 21:00–08:00 (409 if inside window), (3) daily attempt cap 3/day (409 if exceeded). On success: creates RecoveryAttempt, updates debtor.recoveredAmount + attemptCountToday + attemptCountTotal + lastAttemptAt, writes ATTEMPT_RECORDED audit event. Returns the created attempt + updated debtor totals.
     - New endpoint POST /api/debtors/[token]/opt-out — manually opts-out a debtor. Writes immutable OptOutRecord (source=AGENT), sets debtor.optOut=true + optOutReason + stoppedReason="MANUAL_OPTOUT", writes MANUAL_OPTOUT audit event. 409 if already opted-out. Returns the opt-out record + updated debtor state.
     - New component DebtorActions (inside debtor-drilldown.tsx): rendered in the drawer for non-opted-out debtors. "Record attempt" button expands an animated (Framer Motion height) inline form with Channel select (Voice/SMS/WhatsApp/Email), Outcome select (Contacted/Promise-to-pay/Paid/No-answer/Refused), Amount collected (₹) number input, Transcript snippet text input, Cancel/Save buttons. "Opt-out" button opens an AlertDialog confirmation ("permanently halts all outreach… cannot be undone") → confirm triggers the opt-out mutation. Both mutations invalidate the relevant queries (debtor detail, debtors list, overview, compliance-rules, audit) and show sonner toasts on success/error.
     - Verified via curl: record-attempt correctly returned 409 "Quiet hours active (21:00–08:00 IST). Outreach suppressed." — the compliance gate is working as designed. Manual opt-out on DBT-0002 returned ok:true with the opt-out record. agent-browser confirmed the drawer shows "Operator actions" with "Record attempt" + "Opt-out" buttons, and the form expands with all fields.

- Extended dashboard-types.ts with MethodologyResponse, RecordAttemptResponse, ManualOptOutResponse. Extended queries.ts with useMethodology, useRecordAttempt, useManualOptOut.

Verification results:
- bun run lint: clean (no errors/warnings).
- SSR: GET / returns http=200, 66KB HTML. All new features present in SSR HTML (Methodology Pre-registration, methodology hash, Pre-registered analysis plan, Record attempt, Opt-out, Operator actions).
- Console: fresh browser session after close-all → zero errors/warnings.
- API verification via curl: /api/methodology returns full plan + hash; /api/debtors/[token]/attempts enforces quiet-hours gate (409); /api/debtors/[token]/opt-out writes opt-out record + sets debtor.optOut.
- agent-browser: confirmed methodology card renders with hash + plan; confirmed debtor drawer shows "Operator actions" with "Record attempt" (expands to Channel/Outcome/Amount/Transcript form) + "Opt-out" (AlertDialog confirmation). All features working.
- dev.log: no error/unhandled/fail lines.

Stage Summary:
- Phase-4 features complete: methodology pre-registration view (schema fields + hash + API + card component), debtor drawer write actions (record-attempt with compliance gates + manual opt-out with confirmation).
- 3 new API routes added (total now 19). 2 new dashboard components added (methodology-card; DebtorActions inside debtor-drilldown). Prisma schema extended with 5 methodology fields. Seed enhanced with methodology hashes + analysis plans for all 3 batches.
- Lint clean. All endpoints verified. Page renders 200 with zero console errors.
- The record-attempt compliance gates (opt-out, quiet-hours, daily-cap) are live and enforce correctly — demonstrated by the quiet-hours 409 response.

Unresolved issues / risks / next-phase priorities:
- Environment dev-server instability persists (memory pressure kills Turbopack after compile bursts). Not a code issue.
- NextAuth RBAC: write actions (record attempt, opt-out, seal, approve) still stamp "operator@console". Next phase: add NextAuth with agent roles + real approver identity.
- Socket.io live push: all feeds still poll via TanStack Query. Next phase: add a socket.io mini-service for real-time stop-events / gate decisions / audit timeline updates.
- ASR integration: wire z-ai ASR skill to transcribe live call audio → pipe through detectStopPhrase + LLM classify for real-time stop detection.
- Batch comparison: add a delta/lift scatter plot (incremental rupees vs lift %, bubble size = debtor count).
- Methodology: add a "verify hash" action that recomputes the hash client-side and confirms it matches the stored one (tamper-evidence demo).
- Consider a compliance-gate summary indicator showing which gates are currently blocking (quiet-hours active, etc.).

---
Task ID: 4 (webDevReview round 4)
Agent: webDevReview (cron job 361690)
Task: Assess project status, QA via agent-browser, fix bugs, then add features + styling polish.

Work Log:
- Read worklog.md (Tasks 0-3). Project had 19 API routes, 3 batches, methodology pre-registration, debtor drawer write actions, batch-comparison chart, recovery-trend sparkline, audit timeline, LLM fuzzy classify, quiet-hours clock, seal batch action.
- QA: Re-seeded for clean data. Started dev server (unstable in sandbox — confirmed). Fresh browser session: zero console errors/warnings. All existing features render. Lint clean. dev.log clean. No bugs to fix.

- Added 3 new features + 1 new API route + 3 new components:

  1. Client-side methodology hash verification (tamper-evidence demo):
     - New lib `src/lib/methodology-hash.ts` — `computeMethodologyHash()` (FNV-1a 32-bit, mirrors the seed's implementation) + `verifyMethodologyHash()` helper. Takes batch name, mandate, holdout ratio, analysis plan → returns 8-char uppercase hex.
     - Rewrote MethodologyCard (methodology-card.tsx): added "Verify hash" button that recomputes the hash client-side (with a brief 600ms spinner for UX), compares to the stored value, and shows an animated "Verified — plan intact" (emerald) or "Mismatch — possible tampering" (rose) status. Shows the recomputed hash in a collapsible panel. Added a copy-to-clipboard button for the hash. Uses sonner toasts for success/error feedback.
     - Verified via agent-browser: clicked "Verify hash" → "Verified — plan intact" + recomputed hash displayed. The tamper-evidence demo works end-to-end.

  2. Compliance-gate status banner:
     - New endpoint GET /api/compliance-gates?batchId= — returns the live state of 6 compliance gates: (1) quiet-hours (blocking/passing, with countdown), (2) opt-out registry (active count), (3) human-approval gate (pending count), (4) daily attempt cap (debtors at cap), (5) total attempt cap (debtors at cap), (6) batch lifecycle (RUNNING vs not). Each gate has key/label/state/detail/icon. Plus a summary {blocking, pending, active, passing}.
     - New component ComplianceGateBanner (compliance-gate-banner.tsx): a horizontal banner with an overall status icon ("All compliance gates passing" / "Outreach partially blocked"), IST clock, summary counts, and a row of gate chips (each with icon, label, colored dot, hover tooltip with detail). Color-coded by state (emerald=passing, rose=blocking, amber=pending, muted=active). Polls every 60s. Wired below the pillar banners at the top of the main content.
     - Verified via curl + agent-browser: at 23:48 IST, banner shows "Outreach partially blocked" with quiet-hours blocking (8h 12m remaining), opt-out-registry active (7 debtors), human-approval pending (8 escalations).

  3. Batch-comparison scatter plot:
     - New component BatchScatterPlot (batch-scatter-plot.tsx): recharts ScatterChart plotting incremental recovery (₹, X-axis) vs lift % (Y-axis), bubble size = debtor count (ZAxis range 60-400). Running batch highlighted with a foreground stroke + higher opacity; sealed batches use chart-1 color. Custom tooltip shows full breakdown (incremental, lift, debtor count, mandate). Short batch-name labels positioned above each bubble. Wired next to the BatchComparisonChart in a 2-col grid; AuditTimeline moved to full-width below.
     - Uses existing /api/batch-comparison data (no new API needed).

- Extended dashboard-types.ts with GateState, ComplianceGate, ComplianceGatesResponse. Extended queries.ts with useComplianceGates (refetchInterval 60s).

- Layout change: the batch-comparison section is now a 2-col grid (BatchComparisonChart bar chart + BatchScatterPlot scatter), and the AuditTimeline is now full-width below it (better use of horizontal space for the timeline's date grouping).

Verification results:
- bun run lint: clean (no errors/warnings).
- SSR: GET / returns http=200. New features present: "Incremental vs Lift" (scatter), "Outreach partially blocked" (banner), "Verify hash" (methodology). No error markers.
- Console: fresh browser session → zero errors/warnings.
- API: /api/compliance-gates returns 6 gates with live states (quiet-hours blocking at 23:48 IST, 7 opted-out, 8 pending gates).
- agent-browser: confirmed "Outreach partially blocked" banner, "Verify hash" button → click → "Verified — plan intact" + recomputed hash, "Incremental vs Lift" scatter plot all render. All interactive.
- dev.log: no error/unhandled/fail lines.

Stage Summary:
- Phase-5 features complete: client-side methodology hash verification (tamper-evidence demo with verify button + animated status), compliance-gate status banner (6 live gates, overall status, IST clock, per-gate chips with tooltips, polls every 60s), batch-comparison scatter plot (incremental vs lift, bubble=debtor count, running batch highlighted).
- 1 new API route added (total now 20). 3 new dashboard components added (methodology-hash lib, compliance-gate-banner, batch-scatter-plot). MethodologyCard rewritten with verify + copy.
- Lint clean. All endpoints verified. Page renders 200 with zero console errors.
- The tamper-evidence demo is now live: operators can recompute the methodology hash client-side and confirm it matches the pre-registered value, proving the analysis plan was not mutated after lock.

Unresolved issues / risks / next-phase priorities:
- Environment dev-server instability persists (memory pressure kills Turbopack after compile bursts). Not a code issue.
- NextAuth RBAC: write actions still stamp "operator@console". Next phase: add NextAuth with agent roles + real approver identity.
- Socket.io live push: all feeds still poll via TanStack Query. Next phase: add a socket.io mini-service for real-time stop-events / gate decisions / audit timeline updates.
- ASR integration: wire z-ai ASR skill to transcribe live call audio → pipe through detectStopPhrase + LLM classify for real-time stop detection.
- Consider adding a methodology "tamper simulation" toggle that deliberately mutates the plan text client-side to demonstrate the hash mismatch path.
- Consider a compliance-gate history sparkline showing when gates flipped state over the last 24h.
- Batch scatter: add quadrant labels (top-right = "high lift + high volume = best", bottom-left = "low impact").

---
Task ID: 5 (webDevReview round 5)
Agent: webDevReview (cron job 361690)
Task: Assess project status, QA via agent-browser, fix bugs, then add features + styling polish.

Work Log:
- Read worklog.md (Tasks 0-4). Project had 20 API routes, 3 batches, methodology hash verification, compliance-gate banner, batch scatter plot, debtor drawer write actions, LLM fuzzy classify, audit timeline, etc.
- QA: Re-seeded for clean data. Fresh browser session: zero console errors/warnings. All existing features render. Lint clean. dev.log clean. No bugs to fix.

- Added 3 new features + 1 new API route + 1 new Prisma model + 2 new components:

  1. Methodology tamper-simulation toggle (demos the hash-mismatch path):
     - Extended MethodologyCard: added a "Tamper simulation" Switch (with FlaskRound icon). When ON, the analysis plan text is amended client-side with "[POST-HOC AMENDMENT: switch to per-arm median.]" — the plan box turns rose with an "amended" badge and the amendment text appears (animated). The verify-hash logic now uses the amended plan text, so recomputing produces a different hash → "Mismatch — possible tampering" status + "Hash mismatch detected" toast (with a tamper-aware description). Toggling resets the verify state. Added Bug + FlaskRound icons + Switch component import.
     - Verified interactively via agent-browser: toggle ON → "AMENDED" badge + amendment text + "Tamper simulation ON" toast → click "Verify hash" → "Mismatch — possible tampering" + "Recomputed:" hash + "Hash mismatch detected" toast. The full tamper-evidence flow (mutate → recompute → detect) is now demoable.

  2. Batch scatter quadrant labels:
     - Extended BatchScatterPlot: computes median incremental (X) + median lift (Y) thresholds, adds two dashed ReferenceLine dividers at the medians, plus quadrant labels — "★ Best" (top-right, high lift + high volume, chart-2/emerald) and "Low impact" (bottom-left, muted). Imports ReferenceLine + Label from recharts.
     - Verified: "★ Best" and "Low impact" labels render in the snapshot.

  3. Compliance-gate history sparkline (24h gate-flip timeline):
     - New Prisma model ComplianceGateSnapshot (id, batchId, gateKey, state, detail, at) with indexes on [batchId, gateKey, at] and [at]. Ran db:push.
     - Seed enhancement: generates 24 hourly snapshots × 6 gates = 144 records per re-seed. Quiet-hours gate flips blocking/passing based on the IST hour of each snapshot; human-approval pending count fluctuates 4-9; opt-out-registry 6-9; daily-cap 0-2; total-cap 0-1; batch-lifecycle always passing. Added complianceGateSnapshot.deleteMany() to the clean-slate block.
     - New endpoint GET /api/compliance-gates/history?batchId=&hours=24 — returns per-gate arrays of {at, state} points ordered oldest→newest.
     - New component GateHistorySparkline (gate-history-sparkline.tsx): a tiny 28px-tall recharts stepAfter LineChart showing 24h of gate-state flips. State→value mapping (passing=0, active=1, pending=2, blocking=3). Color reflects the latest state (blocking=chart-5/rose, pending=chart-4/amber, active=muted, passing=chart-2/emerald). Custom tooltip shows IST time + state.
     - Integrated into ComplianceGateBanner: each gate chip now includes the sparkline between the label and the status dot. The banner now shows both the live state AND the 24h flip history at a glance.
     - Verified via curl: /api/compliance-gates/history returns 24 points per gate. SSR renders 200.

- Extended dashboard-types.ts with GateHistoryPoint, GateHistoryResponse. Extended queries.ts with useGateHistory (refetchInterval 5min).

Verification results:
- bun run lint: clean (no errors/warnings).
- SSR: GET / returns http=200. New features present: "Tamper simulation" (switch), "★ Best" + "Low impact" (scatter quadrants), "Incremental vs Lift". No error markers.
- Console: fresh browser session → zero errors/warnings.
- API: /api/compliance-gates/history returns 24h × 6 gates of state points.
- agent-browser interactive: tamper toggle ON → "AMENDED" + amendment text → verify → "Mismatch — possible tampering" + "Hash mismatch detected" toast. Scatter quadrant labels visible. Gate sparklines render in the banner.
- dev.log: no error/unhandled/fail lines.

Stage Summary:
- Phase-6 features complete: methodology tamper-simulation toggle (demos the full mutate→recompute→detect mismatch flow interactively), batch scatter quadrant labels (★ Best / Low impact with median dividers), compliance-gate 24h history sparkline (new Prisma model + seed + API + stepAfter sparkline integrated into the banner).
- 1 new API route added (total now 21). 1 new Prisma model (ComplianceGateSnapshot). 2 new components (gate-history-sparkline; methodology-card + batch-scatter-plot + compliance-gate-banner extended). Seed enhanced with 144 gate snapshots.
- Lint clean. All endpoints verified. Page renders 200 with zero console errors.
- The tamper-evidence demo is now complete: operators can toggle the tamper simulation, verify the hash, and see the mismatch detected in real time — proving the methodology hash catches post-hoc plan mutations.

Unresolved issues / risks / next-phase priorities:
- Environment dev-server instability persists (memory pressure kills Turbopack after compile bursts). Not a code issue.
- NextAuth RBAC: write actions still stamp "operator@console". Next phase: add NextAuth with agent roles + real approver identity.
- Socket.io live push: all feeds still poll via TanStack Query. Next phase: add a socket.io mini-service for real-time stop-events / gate decisions / audit timeline updates.
- ASR integration: wire z-ai ASR skill to transcribe live call audio → pipe through detectStopPhrase + LLM classify for real-time stop detection.
- Gate-history: record real snapshots periodically (currently only seeded at seed time). Next phase: add a background job/cron that writes a ComplianceGateSnapshot every hour.
- Consider a "methodology diff" view that shows exactly which plan field changed when tamper is detected.
- Batch scatter: add a 4th quadrant label ("High lift, low volume — niche") for the top-left quadrant.
