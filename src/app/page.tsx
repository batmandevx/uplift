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
import { RadarPacingPanel } from "@/components/dashboard/radar-pacing-panel";
import { GuardrailsChaosPanel } from "@/components/dashboard/guardrails-chaos-panel";
import { VoiceMoatCard } from "@/components/dashboard/voice-moat-card";
import { CommandPalette } from "@/components/dashboard/command-palette";
import { Reveal } from "@/components/dashboard/reveal";
import { HeroTitle, HeroScanline } from "@/components/dashboard/hero-title";
import { LiveOpsTicker } from "@/components/dashboard/live-ticker";
import { QuickActionsDock } from "@/components/dashboard/quick-actions-dock";
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
        {/* Hero title + live ops ticker */}
        <Reveal className="mb-4">
          <div className="flex flex-col gap-3">
            <HeroTitle />
            <HeroScanline />
            <LiveOpsTicker />
          </div>
        </Reveal>

        {/* 4-Pillar banner grid representing Track 03 Thesis */}
        <div className="mb-8 grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
          <Reveal delay={0} spring scale={0.96}>
            <PillarBanner
              index={1}
              tag="DETECT"
              title="Degradation-Aware Pacing"
              description="UPI & NetBanking health radar · Z-score σ=3.0 · Zero retries into outages."
              tone="emerald"
            />
          </Reveal>
          <Reveal delay={0.06} spring scale={0.96}>
            <PillarBanner
              index={2}
              tag="INTERVENE"
              title="Bounded Escalation & Voice"
              description="4-rung ladder · Human approval gate ≥ Rung 2 · Sarvam Hinglish voice moat."
              tone="amber"
            />
          </Reveal>
          <Reveal delay={0.12} spring scale={0.96}>
            <PillarBanner
              index={3}
              tag="PROVE"
              title="Causal Lift & Saboot Ledger"
              description="Pre-registered holdout · Wilson 95% CI · Cryptographic SHA-256 receipts."
              tone="cyan"
            />
          </Reveal>
          <Reveal delay={0.18} spring scale={0.96}>
            <PillarBanner
              index={4}
              tag="GUARDRAIL"
              title="Policy Engine & Chaos Defense"
              description="No LLM in money path · 5% cap block · 34 refused actions · 20/20 chaos recovery."
              tone="purple"
            />
          </Reveal>
        </div>

        {/* Live compliance-gate status banner */}
        <Reveal className="mb-8" delay={0.1}>
          <ComplianceGateBanner batchId={batchId} />
        </Reveal>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
          {/* Left main column: Radar + Causal Lift + Voice Moat */}
          <div className="space-y-6 lg:col-span-2 lg:space-y-8">
            {/* Causal Lift & Measured money recovered */}
            <section aria-label="Pillar 3 — Causal Lift and Measured Recovery">
              <div className="mb-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <PillarTag index={3} tone="cyan" />
                  <div>
                    <h2 className="text-sm font-bold tracking-tight text-foreground">
                      Causal Lift &amp; Measured Money Recovered
                    </h2>
                    <p className="text-[11px] text-muted-foreground">
                      Wilson 95% CI counterfactual proof vs pre-registered holdout (Slide 8 &amp; 10)
                    </p>
                  </div>
                </div>
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

            {/* Radar: Degradation-Aware Pacing */}
            <section aria-label="Pillar 1 — Degradation-aware pacing radar" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <PillarTag index={1} tone="emerald" />
                  <div>
                    <h2 className="text-sm font-bold tracking-tight text-foreground">
                      Payment Rail Radar &amp; Degradation-Aware Pacing
                    </h2>
                    <p className="text-[11px] text-muted-foreground">
                      Sliding window Z-scores (σ = 3.0) &amp; bank outage backoff (Slide 4)
                    </p>
                  </div>
                </div>
              </div>
              <RadarPacingPanel />
            </section>

            <div className="section-divider my-6" />

            {/* Stopping Rules & Voice Moat */}
            <section
              aria-label="Pillar 2 — Stopping rules and voice recovery moat"
              className="space-y-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <PillarTag index={2} tone="amber" />
                  <div>
                    <h2 className="text-sm font-bold tracking-tight text-foreground">
                      Language &amp; Voice Moat: Hinglish Stop Rules &amp; Sarvam AI
                    </h2>
                    <p className="text-[11px] text-muted-foreground">
                      &lt;1.5s streaming voice agent with mandatory digit repeat-back (Slide 6 &amp; 9)
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                <StopRuleSimulator />
                <VoiceMoatCard />
              </div>
              <StopEventsFeed />
            </section>
          </div>

          {/* Right rail: Bounded Escalation, Gate Queue, and Policy Guardrails */}
          <aside
            className="space-y-6 lg:col-span-1"
            aria-label="Escalation, human-in-the-loop gates, and policy guardrails"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <PillarTag index={2} tone="amber" />
                <h2 className="text-sm font-bold tracking-tight text-foreground">
                  Bounded Escalation Ladder
                </h2>
              </div>
            </div>
            <EscalationLadder batchId={batchId} />
            <EscalationGateQueue />

            <div className="section-divider my-6" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <PillarTag index={4} tone="purple" />
                <h2 className="text-sm font-bold tracking-tight text-foreground">
                  Policy Engine &amp; Chaos Defense
                </h2>
              </div>
            </div>
            <GuardrailsChaosPanel />
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

        {/* Clearance so the floating dock never overlaps the footer */}
        <div className="h-14 md:h-16" aria-hidden />
      </main>

      {/* Command palette (Cmd+K / Ctrl+K) */}
      <CommandPalette />

      {/* Floating quick-actions dock */}
      <QuickActionsDock />

      <SiteFooter />
    </div>
  );
}

type PillarTone = "emerald" | "amber" | "rose" | "cyan" | "purple";

function PillarBanner({
  index,
  tag,
  title,
  description,
  tone,
}: {
  index: number;
  tag?: string;
  title: string;
  description: string;
  tone: PillarTone;
}) {
  const ring =
    tone === "emerald"
      ? "border-emerald-500/25 bg-emerald-500/5 hover:border-emerald-500/40"
      : tone === "amber"
        ? "border-amber-500/25 bg-amber-500/5 hover:border-amber-500/40"
        : tone === "cyan"
          ? "border-cyan-500/25 bg-cyan-500/5 hover:border-cyan-500/40"
          : tone === "purple"
            ? "border-purple-500/25 bg-purple-500/5 hover:border-purple-500/40"
            : "border-rose-500/25 bg-rose-500/5 hover:border-rose-500/40";
  const grad =
    tone === "emerald"
      ? "from-emerald-500 via-teal-400 to-transparent"
      : tone === "amber"
        ? "from-amber-500 via-orange-400 to-transparent"
        : tone === "cyan"
          ? "from-cyan-500 via-blue-400 to-transparent"
          : tone === "purple"
            ? "from-purple-500 via-pink-400 to-transparent"
            : "from-rose-500 via-pink-400 to-transparent";
  const badgeBg =
    tone === "emerald"
      ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xs shadow-emerald-500/30"
      : tone === "amber"
        ? "bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-xs shadow-amber-500/30"
        : tone === "cyan"
          ? "bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-xs shadow-cyan-500/30"
          : tone === "purple"
            ? "bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-xs shadow-purple-500/30"
            : "bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-xs shadow-rose-500/30";
  const dot =
    tone === "emerald"
      ? "bg-emerald-500"
      : tone === "amber"
        ? "bg-amber-500"
        : tone === "cyan"
          ? "bg-cyan-500"
          : tone === "purple"
            ? "bg-purple-500"
            : "bg-rose-500";
  const glowCls =
    tone === "emerald"
      ? "glow-emerald"
      : tone === "amber"
        ? "glow-amber"
        : tone === "cyan"
          ? "glow-cyan"
          : tone === "purple"
            ? "glow-rose"
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
        <div className="flex flex-col">
          {tag && (
            <span className="text-[9px] font-mono font-bold tracking-wider uppercase text-muted-foreground">
              [{tag}]
            </span>
          )}
          <h3 className="text-sm font-bold tracking-tight text-foreground leading-tight">{title}</h3>
        </div>
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
  tone: PillarTone;
}) {
  const cls =
    tone === "emerald"
      ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xs shadow-emerald-500/20"
      : tone === "amber"
        ? "bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-xs shadow-amber-500/20"
        : tone === "cyan"
          ? "bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-xs shadow-cyan-500/20"
          : tone === "purple"
            ? "bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-xs shadow-purple-500/20"
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
