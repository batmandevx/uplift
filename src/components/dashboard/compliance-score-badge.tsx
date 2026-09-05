"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Gauge, ShieldCheck, ShieldAlert } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useComplianceGates } from "./queries";

function scoreTone(score: number): {
  ring: string;
  text: string;
  bar: string;
  label: string;
  Icon: typeof ShieldCheck;
} {
  if (score >= 85) {
    return {
      ring: "border-emerald-300/50 bg-emerald-100/70 dark:bg-emerald-950/60",
      text: "text-emerald-700 dark:text-emerald-300",
      bar: "bg-emerald-500",
      label: "Healthy",
      Icon: ShieldCheck,
    };
  }
  if (score >= 60) {
    return {
      ring: "border-amber-300/50 bg-amber-100/70 dark:bg-amber-950/60",
      text: "text-amber-700 dark:text-amber-300",
      bar: "bg-amber-500",
      label: "Watch",
      Icon: Gauge,
    };
  }
  return {
    ring: "border-rose-300/50 bg-rose-100/70 dark:bg-rose-950/60",
    text: "text-rose-700 dark:text-rose-300",
    bar: "bg-rose-500",
    label: "Blocked",
    Icon: ShieldAlert,
  };
}

// Compact compliance-score badge for the site header. Shows a 0-100 numeric
// score with a colored ring + icon + label. Polls /api/compliance-gates.
export function ComplianceScoreBadge({ batchId }: { batchId?: string }) {
  const { data, isLoading } = useComplianceGates(batchId);

  if (isLoading || !data) {
    return <Skeleton className="h-7 w-16 rounded-full" />;
  }

  const score = data.score;
  const tone = scoreTone(score);
  const Icon = tone.Icon;

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
        <TooltipContent side="bottom" className="max-w-[260px] text-center">
          <p className="font-medium">Compliance score: {score}/100</p>
          <p className="text-muted-foreground">
            {tone.label} ·{" "}
            {data.summary.blocking} blocking · {data.summary.pending} pending ·{" "}
            {data.summary.active} active · {data.summary.passing} passing
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Deductions: blocking −25, pending −10, active −5 per gate.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
