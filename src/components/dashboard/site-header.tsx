"use client";

import { ShieldCheck, MapPin, Lock } from "lucide-react";
import { BatchSelector } from "./batch-selector";
import { ThemeToggle } from "@/components/theme-toggle";
import { QuietHoursClock } from "./quiet-hours-clock";
import { ComplianceScoreBadge } from "./compliance-score-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSealBatch } from "./queries";
import { toast } from "sonner";
import type { Batch } from "@/lib/dashboard-types";

export function SiteHeader({
  batch,
  batchId,
  onBatchChange,
}: {
  batch?: Batch;
  batchId?: string;
  onBatchChange: (id: string) => void;
}) {
  const seal = useSealBatch();

  const canSeal = batch?.status === "RUNNING" && !!batchId;

  function onSeal() {
    if (!batchId) return;
    seal.mutate(batchId, {
      onSuccess: (res) =>
        toast.success("Batch sealed", {
          description: `${res.batch.name} locked. Ground truth: ₹${res.groundTruth.incrementalRupees.toLocaleString(
            "en-IN",
          )} incremental recovery across ${res.groundTruth.treatedN} treated.`,
        }),
      onError: (e: Error) =>
        toast.error("Seal failed", { description: e.message }),
    });
  }

  return (
    <header
      className="sticky top-0 z-40 w-full glass border-b border-border/40 backdrop-blur-xl shadow-xs"
      role="banner"
    >
      <div className="mx-auto flex max-w-[1400px] flex-col gap-3 px-4 py-2.5 sm:px-6 md:flex-row md:items-center md:justify-between md:gap-4">
        <div className="flex items-center gap-3">
          <div className="grid size-9.5 place-items-center rounded-lg bg-linear-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20 ring-1 ring-white/20">
            <ShieldCheck className="size-5" aria-hidden />
          </div>
          <div className="leading-tight">
            <h1 className="text-sm font-bold tracking-tight sm:text-base flex items-center gap-2">
              <span>SealedRecovery</span>
              <span className="inline-block size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </h1>
            <p className="text-[11px] font-medium text-muted-foreground sm:text-xs">
              Compliant Collections Ops
            </p>
          </div>
          {batch?.region && (
            <Badge variant="outline" className="ml-1 hidden gap-1 sm:inline-flex bg-background/50 border-border/60 text-xs">
              <MapPin className="size-3 text-muted-foreground" aria-hidden />
              {batch.region}
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ComplianceScoreBadge batchId={batchId} />
          <QuietHoursClock />
          {canSeal && (
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onSeal}
                    disabled={seal.isPending}
                    className="h-8 gap-1.5 border-amber-500/40 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 dark:text-amber-300 dark:hover:bg-amber-500/20 font-medium"
                    aria-label="Seal batch — lock ground truth"
                  >
                    <Lock className="size-3.5" aria-hidden />
                    <span className="hidden sm:inline">Seal batch</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Lock ground truth. Running → Sealed.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <BatchSelector value={batchId} onChange={onBatchChange} />
          <ThemeToggle />
        </div>
      </div>
      <div className="h-[1px] w-full bg-linear-to-r from-transparent via-emerald-500/20 to-transparent" />
    </header>
  );
}
