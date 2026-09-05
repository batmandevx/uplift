"use client";

import { Clock, Moon, Sun } from "lucide-react";
import { useQuietHours } from "./queries";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Quiet-hours live IST clock + outreach-suppression indicator.
// Shown in the site header. Polls /api/quiet-hours every 60s.
export function QuietHoursClock() {
  const { data, isLoading } = useQuietHours();

  if (isLoading || !data) {
    return <Skeleton className="h-7 w-28 rounded-full" />;
  }

  const inside = data.insideQuietHours;
  const Icon = inside ? Moon : Sun;
  const tone = inside
    ? "border-rose-300/50 bg-rose-100/70 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
    : "border-emerald-300/50 bg-emerald-100/70 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300";

  const label = inside ? "Quiet hours" : "Business hours";
  const nextH = Math.floor(data.nextChangeInMinutes / 60);
  const nextM = data.nextChangeInMinutes % 60;
  const nextLabel =
    nextH > 0 ? `${nextH}h ${nextM}m` : `${nextM}m`;
  const tip = inside
    ? `Outreach suppressed. Quiet hours ${data.windowStart}–${data.windowEnd} IST. Resumes in ${nextLabel}.`
    : `Outreach allowed. Quiet hours start ${data.windowStart} IST (in ${nextLabel}).`;

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium tabular-nums ${tone}`}
            role="status"
            aria-live="polite"
          >
            <Icon className="size-3.5" aria-hidden />
            <span className="hidden sm:inline">{label}</span>
            <span className="flex items-center gap-1">
              <Clock className="size-3" aria-hidden />
              {data.nowIst}
            </span>
            <span className="hidden font-mono text-[10px] opacity-70 md:inline">
              IST
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[240px] text-center">
          <p>{tip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
