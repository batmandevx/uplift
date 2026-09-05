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
import { BatchScatterPlot } from "@/components/dashboard/batch-scatter-plot";
import { RecoveryTrendCard } from "@/components/dashboard/recovery-trend-card";
import { AuditTimeline } from "@/components/dashboard/audit-timeline";
import { MethodologyCard } from "@/components/dashboard/methodology-card";
import { ComplianceGateBanner } from "@/components/dashboard/compliance-gate-banner";
import { CommandPalette } from "@/components/dashboard/command-palette";
import { Reveal } from "@/components/dashboard/reveal";
import { useKeyboardShortcuts } from "@/components/dashboard/use-keyboard-shortcuts";
import { useOverview } from "@/components/dashboard/queries";

export default function Home() {
  // Global keyboard shortcuts (T=theme, B=batch selector, ?=help)
  useKeyboardShortcuts();
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
      {/* Ambient backdrop: dotted grid + animated aurora glow */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-grid opacity-60"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[480px] overflow-hidden"
        aria-hidden
      >
        <div className="absolute inset-0 bg-aurora aurora-drift" />
      </div>
      <SiteHeader
        batch={activeBatch}
        batchId={batchId}
        onBatchChange={setSelectedBatchId}
      />

      <main
        className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6 sm:py-8"
        role="main"
      >
        {/* Hero title */}
        <Reveal className="mb-6">
          <div className="flex flex-col gap-1.5">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-500">
              <span className="inline-block size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Real-time Recovery Operations & Compliance Engine
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl text-foreground">
              Compliant Collections{" "}
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                Command Center
              </span>
            </h1>
            <p className="max-w-3xl text-sm text-muted-foreground/90 leading-relaxed">
              Pre-registered holdout · Mandate-gated escalation · Hinglish stop rules — measured, audited, and sealed with causal rigor.
            </p>
          </div>
        </Reveal>

        {/* Pillar banner */}
        <div className="mb-8 grid grid-cols-1 gap-3.5 sm:grid-cols-3">
          <Reveal delay={0}>
            <PillarBanner
              index={1}
              title="Measured money recovered"
              description="Pre-registered holdout · Wilson 95% CI · Meta-validation against sealed batch."
              tone="emerald"
            />
          </Reveal>
          <Reveal delay={0.08}>
            <PillarBanner
              index={2}
              title="Compliant escalation"
              description="4-rung ladder · Human-approval gate for rung ≥ 2 · Quiet hours & attempt caps."
              tone="amber"
            />
          </Reveal>
          <Reveal delay={0.16}>
            <PillarBanner
              index={3}
              title="Stopping rules"
              description="Live Hinglish stop-phrase detection · Opt-out written · Outreach halted instantly."
              tone="rose"
            />
          </Reveal>
        </div>

        {/* Live compliance-gate status banner */}
        <Reveal className="mb-8" delay={0.1}>
          <ComplianceGateBanner batchId={batchId} />
        </Reveal>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
          {/* Left main column: Pillar 1 + Pillar 3 */}
          <div className="space-y-6 lg:col-span-2 lg:space-y-8">
            <section aria-label="Pillar 1 — Measured money recovered">
              <div className="mb-3.5 flex items-center gap-2.5">
                <PillarTag index={1} tone="emerald" />
                <h2 className="text-sm font-bold tracking-tight text-foreground">
                  Measured money recovered across the batch
                </h2>
              </div>
              <OverviewKPIs />
              <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
                <HoldoutComparisonChart batchId={batchId} />
                <RecoveryDistributionChart batchId={batchId} />
              </div>
              <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
                <MetaValidationPanel />
                <RecoveryTrendCard batchId={batchId} />
              </div>
              <div className="mt-5">
                <MethodologyCard batchId={batchId} />
              </div>
            </section>

            <div className="section-divider my-6" />

            <section
              aria-label="Pillar 3 — Stopping rules"
              className="space-y-5"
            >
              <div className="flex items-center gap-2.5">
                <PillarTag index={3} tone="rose" />
                <h2 className="text-sm font-bold tracking-tight text-foreground">
                  Stopping rules — live demo (Hinglish first-class)
                </h2>
              </div>
              <StopRuleSimulator />
              <StopEventsFeed />
            </section>
          </div>

          {/* Right rail: Pillar 2 */}
          <aside
            className="space-y-6 lg:col-span-1"
            aria-label="Pillar 2 — Compliant escalation rail"
          >
            <div className="flex items-center gap-2.5">
              <PillarTag index={2} tone="amber" />
              <h2 className="text-sm font-bold tracking-tight text-foreground">
                Compliant escalation
              </h2>
            </div>
            <EscalationLadder batchId={batchId} />
            <EscalationGateQueue />
            <ComplianceRulesPanel batchId={batchId} />
          </aside>
        </div>

        <div className="section-divider my-8" />

        {/* Full-width cross-cutting: per-debtor drill-down */}
        <section
          aria-label="Debtor registry and drill-down"
          className="mt-6"
        >
          <Reveal>
            <DebtorDrilldown batchId={batchId} />
          </Reveal>
        </section>

        <div className="section-divider my-8" />

        {/* Full-width cross-cutting: batch comparison + audit timeline */}
        <section
          aria-label="Batch comparison and audit timeline"
          className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2"
        >
          <Reveal delay={0.05}>
            <BatchComparisonChart />
          </Reveal>
          <Reveal delay={0.1}>
            <BatchScatterPlot />
          </Reveal>
        </section>

        <div className="section-divider my-8" />

        {/* Full-width: audit timeline */}
        <section
          aria-label="Audit timeline"
          className="mt-6"
        >
          <Reveal delay={0.1}>
            <AuditTimeline />
          </Reveal>
        </section>
      </main>

      {/* Command palette (Cmd+K / Ctrl+K) */}
      <CommandPalette />

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
      ? "border-emerald-500/25 bg-emerald-500/5 hover:border-emerald-500/40"
      : tone === "amber"
        ? "border-amber-500/25 bg-amber-500/5 hover:border-amber-500/40"
        : "border-rose-500/25 bg-rose-500/5 hover:border-rose-500/40";
  const grad =
    tone === "emerald"
      ? "from-emerald-500 via-teal-400 to-transparent"
      : tone === "amber"
        ? "from-amber-500 via-orange-400 to-transparent"
        : "from-rose-500 via-pink-400 to-transparent";
  const badgeBg =
    tone === "emerald"
      ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xs shadow-emerald-500/30"
      : tone === "amber"
        ? "bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-xs shadow-amber-500/30"
        : "bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-xs shadow-rose-500/30";
  const dot =
    tone === "emerald" ? "bg-emerald-500" : tone === "amber" ? "bg-amber-500" : "bg-rose-500";
  const glowCls =
    tone === "emerald"
      ? "glow-emerald"
      : tone === "amber"
        ? "glow-amber"
        : "glow-rose";

  return (
    <div
      className={`glass group relative h-full overflow-hidden rounded-xl border p-4.5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${ring}`}
    >
      {/* top sheen */}
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r ${grad} opacity-75 transition-opacity duration-300 group-hover:opacity-100`}
        aria-hidden
      />
      <div className="flex items-center gap-2.5">
        <span
          className={`grid size-7 place-items-center rounded-lg ${badgeBg} text-xs font-bold shadow-xs`}
          aria-hidden
        >
          {index}
        </span>
        <h3 className="text-sm font-bold tracking-tight text-foreground">{title}</h3>
        <span
          className={`ml-auto size-2 rounded-full ${dot} ${glowCls} opacity-80 transition-opacity group-hover:opacity-100 animate-pulse`}
          style={{ color: "currentColor" }}
          aria-hidden
        />
      </div>
      <p className="mt-2 text-xs text-muted-foreground/90 leading-relaxed">{description}</p>
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
      ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xs shadow-emerald-500/20"
      : tone === "amber"
        ? "bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-xs shadow-amber-500/20"
        : "bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-xs shadow-rose-500/20";
  return (
    <span
      className={`grid size-5.5 place-items-center rounded-md text-[11px] font-bold ${cls}`}
      aria-hidden
    >
      {index}
    </span>
  );
}
