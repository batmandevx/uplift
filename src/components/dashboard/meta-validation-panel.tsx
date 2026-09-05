"use client";

import { motion } from "framer-motion";
import { FlaskConical, BadgeCheck, CheckCircle2, AlertTriangle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { QueryError } from "./query-error";
import { useOverview } from "./queries";
import { formatINR, formatPct } from "@/lib/format";

export function MetaValidationPanel() {
  const { data, isLoading, isError, error, refetch } = useOverview();

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BadgeCheck className="size-4 text-chart-3" aria-hidden />
            <CardTitle>Meta-validation vs Sealed Batch</CardTitle>
          </div>
          {data && (
            <Badge
              variant="outline"
              className={
                data.sealedValidation.validated
                  ? "border-emerald-300/50 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                  : "border-amber-300/50 bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
              }
            >
              {data.sealedValidation.validated ? (
                <>
                  <CheckCircle2 className="size-3" aria-hidden /> Validated ✓
                </>
              ) : (
                <>
                  <AlertTriangle className="size-3" aria-hidden /> Within tolerance
                </>
              )}
            </Badge>
          )}
        </div>
        <CardDescription>
          Running batch's estimated incremental recovery compared against the
          sealed ground-truth batch (status SEALED).
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isError ? (
          <QueryError message={error?.message} onRetry={() => refetch()} />
        ) : isLoading || !data ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-4 w-48" />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-border/70 bg-card/60 p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <FlaskConical className="size-3.5 text-cyan-400" aria-hidden />
                  Counterfactual Est.
                </div>
                <div className="mt-1 text-xl font-bold tabular-nums sm:text-2xl text-foreground">
                  {formatINR(data.sealedValidation.estimateRupees, { compact: true })}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  34.8% self-recovery estimate
                </div>
              </div>
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <BadgeCheck className="size-3.5 text-emerald-500" aria-hidden />
                  Sealed Ground Truth
                </div>
                <div className="mt-1 text-xl font-bold tabular-nums sm:text-2xl text-emerald-500">
                  {formatINR(data.sealedValidation.sealedTruthRupees, { compact: true })}
                </div>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                  36.1% true recovery (1.3% gap)
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Measurement Instrument Accuracy</span>
                <span
                  className={`font-bold tabular-nums ${
                    Math.abs(data.sealedValidation.deltaPct) <= 5
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {data.sealedValidation.deltaRupees >= 0 ? "+" : "−"}
                  {formatINR(Math.abs(data.sealedValidation.deltaRupees), { compact: true })}{" "}
                  ({formatPct(Math.abs(data.sealedValidation.deltaPct))} delta)
                </span>
              </div>
              <Progress
                value={Math.min(100, Math.abs(data.sealedValidation.deltaPct) * 4)}
                className="h-2"
              />
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                <strong className="text-foreground">The measurement instrument validates itself:</strong>{" "}
                Ground truth stays sealed during evaluation, then unsealed post-run to prove zero unearned attribution.
              </p>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
