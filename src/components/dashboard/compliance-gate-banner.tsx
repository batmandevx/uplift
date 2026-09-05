"use client";

import { motion } from "framer-motion";
import {
  Moon,
  Ban,
  UserCheck,
  Gauge,
  Activity,
  ShieldCheck,
  ShieldAlert,
  Clock,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryError } from "./query-error";
import { useComplianceGates } from "./queries";
import { GateHistorySparkline } from "./gate-history-sparkline";
import type { GateState } from "@/lib/dashboard-types";

const ICONS: Record<string, LucideIcon> = {
  moon: Moon,
  ban: Ban,
  "user-check": UserCheck,
  gauge: Gauge,
  activity: Activity,
};

const STATE_STYLES: Record<
  GateState,
  { ring: string; dot: string; label: string; text: string }
> = {
  passing: {
    ring: "border-emerald-300/40 bg-emerald-50/50 dark:bg-emerald-950/20",
    dot: "bg-emerald-500",
    label: "Passing",
    text: "text-emerald-700 dark:text-emerald-300",
  },
  blocking: {
    ring: "border-rose-300/50 bg-rose-50/70 dark:bg-rose-950/40",
    dot: "bg-rose-500",
    label: "Blocking",
    text: "text-rose-700 dark:text-rose-300",
  },
  pending: {
    ring: "border-amber-300/50 bg-amber-50/70 dark:bg-amber-950/40",
    dot: "bg-amber-500",
    label: "Pending",
    text: "text-amber-700 dark:text-amber-300",
  },
  active: {
    ring: "border-border bg-muted/40",
    dot: "bg-muted-foreground",
    label: "Active",
    text: "text-muted-foreground",
  },
};

export function ComplianceGateBanner({ batchId }: { batchId?: string }) {
  const { data, isLoading, isError, error, refetch } =
    useComplianceGates(batchId);

  if (isError) {
    return <QueryError message={error?.message} onRetry={() => refetch()} />;
  }
  if (isLoading || !data) {
    return <Skeleton className="h-20 w-full rounded-xl" />;
  }

  const { summary, gates, nowIst } = data;
  const hasBlockers = summary.blocking > 0;
  const overallIcon = hasBlockers ? ShieldAlert : ShieldCheck;
  const OverallIcon = overallIcon;
  const overallTone = hasBlockers
    ? "border-rose-500/30 bg-rose-500/10 shadow-xs shadow-rose-500/5"
    : "border-emerald-500/30 bg-emerald-500/10 shadow-xs shadow-emerald-500/5";
  const overallText = hasBlockers
    ? "text-rose-600 dark:text-rose-400"
    : "text-emerald-600 dark:text-emerald-400";
  const topGrad = hasBlockers
    ? "from-rose-500 via-pink-400 to-transparent"
    : "from-emerald-500 via-teal-400 to-transparent";

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`glass relative overflow-hidden rounded-xl border p-4.5 ${overallTone}`}
      role="region"
      aria-label="Compliance gate status"
    >
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r ${topGrad}`}
        aria-hidden
      />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`grid size-9.5 place-items-center rounded-lg ${hasBlockers ? "bg-rose-500/20 text-rose-500 border border-rose-500/30" : "bg-emerald-500/20 text-emerald-500 border border-emerald-500/30"} shadow-xs`}>
            <OverallIcon className="size-5" aria-hidden />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-foreground flex items-center gap-2">
              <span>
                {hasBlockers
                  ? "Outreach partially blocked by compliance gates"
                  : "All compliance gates passing"}
              </span>
              <span className={`inline-block size-2 rounded-full ${hasBlockers ? "bg-rose-500 animate-ping" : "bg-emerald-500"}`} />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
              <Clock className="size-3.5 text-muted-foreground" aria-hidden />
              <span className="tabular-nums font-medium text-foreground">{nowIst} IST</span>
              <span>·</span>
              <span>
                <strong className="text-emerald-600 dark:text-emerald-400">{summary.passing}</strong> passing ·{" "}
                {summary.blocking > 0 ? <strong className="text-rose-500">{summary.blocking} blocking</strong> : "0 blocking"} ·{" "}
                <strong className="text-amber-500">{summary.pending}</strong> pending ·{" "}
                <span>{summary.active} active</span>
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {gates.map((g, i) => {
            const Icon = ICONS[g.icon] ?? ShieldCheck;
            const st = STATE_STYLES[g.state];
            const isBlocking = g.state === "blocking";
            return (
              <motion.div
                key={g.key}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
                className={`group relative flex items-center gap-2 rounded-lg border px-2.5 py-1.5 transition-all duration-200 hover:scale-[1.02] ${st.ring}`}
                title={g.detail}
              >
                <Icon className={`size-3.5 ${st.text}`} aria-hidden />
                <span className="text-xs font-semibold">{g.label}</span>
                <GateHistorySparkline
                  batchId={batchId}
                  gateKey={g.key}
                  latestState={g.state}
                />
                <span
                  className={`size-2 rounded-full ${st.dot} ${isBlocking ? "animate-ping" : ""}`}
                  aria-hidden
                />
                {/* Tooltip on hover */}
                <div className="pointer-events-none absolute left-1/2 bottom-full z-20 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border bg-popover/95 backdrop-blur-md px-3 py-1.5 text-xs font-medium text-popover-foreground shadow-xl group-hover:block">
                  {g.detail}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
