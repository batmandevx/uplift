"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Gauge, ShieldCheck, ShieldAlert } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  YAxis,
  type TooltipProps,
} from "recharts";
import { useComplianceGates, useGateHistory } from "./queries";
import type { GateState } from "@/lib/dashboard-types";

function scoreTone(score: number): {
  ring: string;
  text: string;
  bar: string;
  label: string;
  Icon: typeof ShieldCheck;
} {
  if (score >= 85) {
    return {
      ring: "border-emerald-500/40 bg-emerald-500/10 dark:bg-emerald-500/15 shadow-xs shadow-emerald-500/10",
      text: "text-emerald-600 dark:text-emerald-400",
      bar: "bg-emerald-500",
      label: "Healthy",
      Icon: ShieldCheck,
    };
  }
  if (score >= 60) {
    return {
      ring: "border-amber-500/40 bg-amber-500/10 dark:bg-amber-500/15 shadow-xs shadow-amber-500/10",
      text: "text-amber-600 dark:text-amber-400",
      bar: "bg-amber-500",
      label: "Watch",
      Icon: Gauge,
    };
  }
  return {
    ring: "border-rose-500/40 bg-rose-500/10 dark:bg-rose-500/15 shadow-xs shadow-rose-500/10",
    text: "text-rose-600 dark:text-rose-400",
    bar: "bg-rose-500",
    label: "Blocked",
    Icon: ShieldAlert,
  };
}

// Compute a compliance score (0-100) from a set of gate states.
// Mirrors the server-side formula: blocking −25, pending −10, active −5.
function scoreFromGates(gates: { state: string }[]): number {
  let blocking = 0,
    pending = 0,
    active = 0;
  for (const g of gates) {
    if (g.state === "blocking") blocking++;
    else if (g.state === "pending") pending++;
    else if (g.state === "active") active++;
  }
  return Math.max(0, 100 - (blocking * 25 + pending * 10 + active * 5));
}

function ScoreSparkTooltip({
  active,
  payload,
}: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;
  const p = payload[0]?.payload as { at: string; score: number } | undefined;
  if (!p) return null;
  const d = new Date(p.at);
  const ist = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
  const hh = String(ist.getUTCHours()).padStart(2, "0");
  const mm = String(ist.getUTCMinutes()).padStart(2, "0");
  return (
    <div className="rounded-md border bg-popover px-2 py-1 text-[10px] shadow-md">
      <div className="font-medium tabular-nums">{hh}:{mm} IST</div>
      <div className="text-muted-foreground">Score: {p.score}/100</div>
    </div>
  );
}

// Compact compliance-score badge for the site header. Shows a 0-100 numeric
// score with a colored ring + icon + label. The tooltip includes a 24h score
// trend sparkline computed from the gate-history data. Polls every 60s.
export function ComplianceScoreBadge({ batchId }: { batchId?: string }) {
  const { data, isLoading } = useComplianceGates(batchId);
  const { data: history } = useGateHistory(batchId, 24);

  // Compute 24h score trend from gate history: group points by timestamp,
  // compute the score for each hour.
  const scoreHistory = React.useMemo(() => {
    if (!history) return [];
    // Flatten all gate points and group by `at` timestamp
    const byTime = new Map<string, { state: string }[]>();
    for (const gate of history.gates) {
      for (const pt of gate.points) {
        const arr = byTime.get(pt.at) ?? [];
        arr.push({ state: pt.state });
        byTime.set(pt.at, arr);
      }
    }
    const points = Array.from(byTime.entries())
      .map(([at, gates]) => ({ at, score: scoreFromGates(gates) }))
      .sort((a, b) => (a.at < b.at ? -1 : 1));
    return points;
  }, [history]);

  if (isLoading || !data) {
    return <Skeleton className="h-7 w-16 rounded-full" />;
  }

  const score = data.score;
  const tone = scoreTone(score);
  const Icon = tone.Icon;
  const minScore = scoreHistory.length
    ? Math.min(...scoreHistory.map((p) => p.score))
    : score;

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold tabular-nums ${tone.ring} ${tone.text}`}
            role="status"
            aria-label={`Compliance score ${score} out of 100, ${tone.label}`}
          >
            <Icon className="size-3.5" aria-hidden />
            <span className="tabular-nums">{score}</span>
            <span className="hidden text-[10px] font-normal opacity-70 sm:inline">
              /100
            </span>
            {/* mini progress bar */}
            <span className="hidden h-1 w-8 overflow-hidden rounded-full bg-background/60 sm:inline">
              <motion.span
                className={`block h-full rounded-full ${tone.bar}`}
                initial={{ width: 0 }}
                animate={{ width: `${score}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                aria-hidden
              />
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="w-[220px] p-3">
          <p className="text-center text-xs font-medium">
            Compliance score: {score}/100 · {tone.label}
          </p>
          <p className="text-center text-[10px] text-muted-foreground">
            {data.summary.blocking} blocking · {data.summary.pending} pending ·{" "}
            {data.summary.active} active · {data.summary.passing} passing
          </p>
          {/* 24h score trend sparkline */}
          {scoreHistory.length > 1 && (
            <div className="mt-2 h-10 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={scoreHistory}
                  margin={{ top: 2, right: 4, left: 4, bottom: 0 }}
                >
                  <YAxis
                    domain={[0, 100]}
                    hide
                  />
                  <Tooltip content={<ScoreSparkTooltip />} cursor={false} />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="var(--chart-2)"
                    strokeWidth={1.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          <p className="mt-1 text-center text-[9px] text-muted-foreground">
            24h trend · min {minScore} · now {score}
          </p>
          <p className="mt-1 text-center text-[9px] text-muted-foreground">
            blocking −25 · pending −10 · active −5
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
