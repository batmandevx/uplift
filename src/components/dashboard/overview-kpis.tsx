"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Wallet,
  Scale,
  Activity,
  type LucideIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { QueryError } from "./query-error";
import { useOverview } from "./queries";
import { formatINR, formatNumber, formatPct } from "@/lib/format";
import type { BatchStatus } from "@/lib/dashboard-types";

const statusVariant: Record<BatchStatus, string> = {
  RUNNING:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300/40",
  SEALED:
    "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300/40",
  DRAFT: "bg-muted text-muted-foreground border-border",
  CLOSED:
    "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300/40",
};

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  accent = "default",
  index,
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  accent?: "default" | "emerald" | "amber" | "rose";
  index: number;
}) {
  const accentRing =
    accent === "emerald"
      ? "text-emerald-600 dark:text-emerald-400"
      : accent === "amber"
        ? "text-amber-600 dark:text-amber-400"
        : accent === "rose"
          ? "text-rose-600 dark:text-rose-400"
          : "text-foreground";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: "easeOut" }}
    >
      <Card className="h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardDescription className="text-xs">{label}</CardDescription>
            <Icon className={`size-4 ${accentRing}`} aria-hidden />
          </div>
          <CardTitle className="text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">
            {value}
          </CardTitle>
        </CardHeader>
        {sub && (
          <CardContent className="pt-0">
            <div className="text-xs text-muted-foreground">{sub}</div>
          </CardContent>
        )}
      </Card>
    </motion.div>
  );
}

function KpiSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-2 h-8 w-32" />
      </CardHeader>
      <CardContent className="pt-0">
        <Skeleton className="h-3 w-40" />
      </CardContent>
    </Card>
  );
}

export function OverviewKPIs() {
  const { data, isLoading, isError, error, refetch } = useOverview();

  if (isError) {
    return (
      <QueryError
        message={error?.message}
        onRetry={() => refetch()}
      />
    );
  }

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <KpiSkeleton key={i} />
        ))}
      </div>
    );
  }

  const { kpis, batch } = data;
  const positiveInc = kpis.incrementalRupees >= 0;

  return (
    <section aria-label="Headline KPIs" className="space-y-3">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          index={0}
          icon={Wallet}
          label="Total Recovered"
          value={formatINR(kpis.totalRecovered)}
          sub={
            <>
              across <span className="font-medium text-foreground">{formatNumber(batch.debtorCount)}</span> debtors
            </>
          }
        />
        <KpiCard
          index={1}
          icon={TrendingUp}
          label="Incremental vs Holdout"
          accent={positiveInc ? "emerald" : "rose"}
          value={
            <span className="tabular-nums">
              {positiveInc ? "+" : "−"}
              {formatINR(Math.abs(kpis.incrementalRupees))}
            </span>
          }
          sub={
            <span
              className={
                positiveInc
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }
            >
              {positiveInc ? "▲" : "▼"} {formatPct(kpis.incrementalPct)} lift
              over holdout baseline
            </span>
          }
        />
        <KpiCard
          index={2}
          icon={Scale}
          label="Pre-registered Holdout"
          value={formatPct(kpis.holdoutRatio * 100, 0)}
          sub={
            <>
              treated <span className="font-medium text-foreground">{formatNumber(kpis.treatedN)}</span>{" "}
              · holdout <span className="font-medium text-foreground">{formatNumber(kpis.holdoutN)}</span>
            </>
          }
        />
        <Card className="h-full">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs">Batch Status</CardDescription>
              <Activity className="size-4 text-foreground" aria-hidden />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Badge
                variant="outline"
                className={statusVariant[batch.status]}
              >
                {batch.status}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {batch.mandateLevel} mandate
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xs text-muted-foreground">
              Started {new Date(batch.startedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
