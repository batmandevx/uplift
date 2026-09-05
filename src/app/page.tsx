"use client";

import * as React from "react";
import { SiteHeader } from "@/components/dashboard/site-header";
import { SiteFooter } from "@/components/dashboard/site-footer";
import { OverviewKPIs } from "@/components/dashboard/overview-kpis";
import { HoldoutComparisonChart } from "@/components/dashboard/holdout-comparison-chart";
import { RecoveryDistributionChart } from "@/components/dashboard/recovery-distribution-chart";
import { MetaValidationPanel } from "@/components/dashboard/meta-validation-panel";
import { EscalationLadder } from "@/components/dashboard/escalation-ladder";
import { EscalationGateQueue } from "@/components/dashboard/escalation-gate-queue";
import { ComplianceRulesPanel } from "@/components/dashboard/compliance-rules-panel";
import { StopRuleSimulator } from "@/components/dashboard/stop-rule-simulator";
import { StopEventsFeed } from "@/components/dashboard/stop-events-feed";
import { DebtorDrilldown } from "@/components/dashboard/debtor-drilldown";
import { BatchComparisonChart } from "@/components/dashboard/batch-comparison-chart";
import { RecoveryTrendCard } from "@/components/dashboard/recovery-trend-card";
import { AuditTimeline } from "@/components/dashboard/audit-timeline";
import { useOverview } from "@/components/dashboard/queries";

export default function Home() {
  // Default to the RUNNING batch returned by /api/overview; let the operator
  // override via the batch selector in the header.
  const overview = useOverview();
  const defaultBatchId = overview.data?.batch?.id;
  const [selectedBatchId, setSelectedBatchId] = React.useState<string | undefined>(undefined);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    // Pick the default once overview resolves.
    if (!hydrated && defaultBatchId) {
      setSelectedBatchId(defaultBatchId);
      setHydrated(true);
    }
  }, [hydrated, defaultBatchId]);

  const batchId = selectedBatchId ?? defaultBatchId;
  const activeBatch = overview.data?.batch;

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      {/* Ambient backdrop: dotted grid + soft aurora glow */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-grid opacity-60"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[420px] bg-aurora"
        aria-hidden
      />
      <SiteHeader
        batch={activeBatch}
        batchId={batchId}
        onBatchChange={setSelectedBatchId}
      />

      <main
        className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6 sm:py-8"
        role="main"
      >
        {/* Pillar banner */}
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <PillarBanner
            index={1}
            title="Measured money recovered"
            description="Pre-registered holdout · Wilson 95% CI · Meta-validation against sealed batch."
            tone="emerald"
          />
          <PillarBanner
            index={2}
            title="Compliant escalation"
            description="4-rung ladder · Human-approval gate for rung ≥ 2 · Quiet hours & attempt caps."
            tone="amber"
          />
          <PillarBanner
            index={3}
            title="Stopping rules"
            description="Live Hinglish stop-phrase detection · Opt-out written · Outreach halted instantly."
            tone="rose"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
          {/* Left main column: Pillar 1 + Pillar 3 */}
          <div className="space-y-4 lg:col-span-2 lg:space-y-6">
            <section aria-label="Pillar 1 — Measured money recovered">
              <div className="mb-3 flex items-center gap-2">
                <PillarTag index={1} tone="emerald" />
                <h2 className="text-sm font-semibold tracking-tight">
                  Measured money recovered across the batch
                </h2>
              </div>
              <OverviewKPIs />
              <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
                <HoldoutComparisonChart batchId={batchId} />
                <RecoveryDistributionChart batchId={batchId} />
              </div>
              <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
                <MetaValidationPanel />
                <RecoveryTrendCard batchId={batchId} />
              </div>
            </section>

            <section
              aria-label="Pillar 3 — Stopping rules"
              className="space-y-4 lg:space-y-6"
            >
              <div className="flex items-center gap-2">
                <PillarTag index={3} tone="rose" />
                <h2 className="text-sm font-semibold tracking-tight">
                  Stopping rules — live demo (Hinglish first-class)
                </h2>
              </div>
              <StopRuleSimulator />
              <StopEventsFeed />
            </section>
          </div>

          {/* Right rail: Pillar 2 */}
          <aside
            className="space-y-4 lg:col-span-1 lg:space-y-6"
            aria-label="Pillar 2 — Compliant escalation rail"
          >
            <div className="flex items-center gap-2">
              <PillarTag index={2} tone="amber" />
              <h2 className="text-sm font-semibold tracking-tight">
                Compliant escalation
              </h2>
            </div>
            <EscalationLadder batchId={batchId} />
            <EscalationGateQueue />
            <ComplianceRulesPanel batchId={batchId} />
          </aside>
        </div>

        {/* Full-width cross-cutting: per-debtor drill-down */}
        <section
          aria-label="Debtor registry and drill-down"
          className="mt-4 lg:mt-6"
        >
          <DebtorDrilldown batchId={batchId} />
        </section>

        {/* Full-width cross-cutting: batch comparison + audit timeline */}
        <section
          aria-label="Batch comparison and audit timeline"
          className="mt-4 grid grid-cols-1 gap-4 lg:mt-6 lg:grid-cols-2 lg:gap-6"
        >
          <BatchComparisonChart />
          <AuditTimeline />
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function PillarBanner({
  index,
  title,
  description,
  tone,
}: {
  index: number;
  title: string;
  description: string;
  tone: "emerald" | "amber" | "rose";
}) {
  const ring =
    tone === "emerald"
      ? "border-emerald-300/40 bg-emerald-50/50 dark:bg-emerald-950/20"
      : tone === "amber"
        ? "border-amber-300/40 bg-amber-50/50 dark:bg-amber-950/20"
        : "border-rose-300/40 bg-rose-50/50 dark:bg-rose-950/20";
  const dot =
    tone === "emerald"
      ? "bg-emerald-500"
      : tone === "amber"
        ? "bg-amber-500"
        : "bg-rose-500";
  return (
    <div
      className={`group rounded-xl border p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${ring}`}
    >
      <div className="flex items-center gap-2">
        <span className="grid size-6 place-items-center rounded-md bg-background text-xs font-semibold text-foreground shadow-sm">
          {index}
        </span>
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        <span
          className={`ml-auto size-1.5 rounded-full ${dot} opacity-60 transition-opacity group-hover:opacity-100`}
          aria-hidden
        />
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function PillarTag({
  index,
  tone,
}: {
  index: number;
  tone: "emerald" | "amber" | "rose";
}) {
  const cls =
    tone === "emerald"
      ? "bg-emerald-600 text-white"
      : tone === "amber"
        ? "bg-amber-600 text-white"
        : "bg-rose-600 text-white";
  return (
    <span
      className={`grid size-5 place-items-center rounded text-[10px] font-bold ${cls}`}
      aria-hidden
    >
      {index}
    </span>
  );
}
