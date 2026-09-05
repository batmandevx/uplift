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
    ? "border-rose-300/50 bg-rose-50/60 dark:bg-rose-950/30"
    : "border-emerald-300/50 bg-emerald-50/60 dark:bg-emerald-950/30";
  const overallText = hasBlockers
    ? "text-rose-700 dark:text-rose-300"
    : "text-emerald-700 dark:text-emerald-300";

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`rounded-xl border p-4 ${overallTone}`}
      role="region"
      aria-label="Compliance gate status"
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <OverallIcon className={`size-5 ${overallText}`} aria-hidden />
          <div>
            <div className="text-sm font-semibold">
              {hasBlockers
                ? "Outreach partially blocked"
                : "All compliance gates passing"}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Clock className="size-3" aria-hidden />
              <span className="tabular-nums">{nowIst}</span>
              <span>IST</span>
              <span>·</span>
              <span>
                {summary.passing} passing · {summary.blocking} blocking ·{" "}
                {summary.pending} pending · {summary.active} active
              </span>
            </div>
          </div>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          {gates.map((g, i) => {
            const Icon = ICONS[g.icon] ?? ShieldCheck;
            const st = STATE_STYLES[g.state];
            return (
              <motion.div
                key={g.key}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
                className={`group relative flex items-center gap-1.5 rounded-lg border px-2 py-1 ${st.ring}`}
                title={g.detail}
              >
                <Icon className={`size-3.5 ${st.text}`} aria-hidden />
                <span className="text-[11px] font-medium">{g.label}</span>
                <span
                  className={`size-1.5 rounded-full ${st.dot}`}
                  aria-hidden
                />
                {/* Tooltip on hover */}
                <div className="pointer-events-none absolute left-1/2 top-full z-20 mt-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md border bg-popover px-2 py-1 text-[10px] text-popover-foreground shadow-md group-hover:block">
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
