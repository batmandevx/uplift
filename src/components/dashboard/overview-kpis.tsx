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
import { formatNumber, formatPct } from "@/lib/format";
import { useAnimatedNumber } from "./use-animated-number";
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

// Compact INR formatter for animated counters (no currency symbol jitter).
function formatINRCompact(value: number): string {
  if (!Number.isFinite(value)) return "₹0";
  const abs = Math.abs(value);
  if (abs >= 1_00_00_000) return `₹${(value / 1_00_00_000).toFixed(2)} Cr`;
  if (abs >= 1_00_000) return `₹${(value / 1_00_000).toFixed(2)} L`;
  if (abs >= 1_000) return `₹${(value / 1_000).toFixed(1)}K`;
  return `₹${Math.round(value)}`;
}

function AnimatedINR({ value, prefix = "" }: { value: number; prefix?: string }) {
  const v = useAnimatedNumber(value);
  return (
    <span className="tabular-nums">
      {prefix}
      {formatINRCompact(v)}
    </span>
  );
}

function AnimatedPct({ value, digits = 1 }: { value: number; digits?: number }) {
  const v = useAnimatedNumber(value);
  return <span className="tabular-nums">{v.toFixed(digits)}%</span>;
}

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  accent = "default",
  index,
  glow,
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  accent?: "default" | "emerald" | "amber" | "rose";
  index: number;
  glow?: boolean;
}) {
  const accentText =
    accent === "emerald"
      ? "text-emerald-500 dark:text-emerald-400"
      : accent === "amber"
        ? "text-amber-500 dark:text-amber-400"
        : accent === "rose"
          ? "text-rose-500 dark:text-rose-400"
          : "text-primary";

  const accentIconBg =
    accent === "emerald"
      ? "bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 text-emerald-500 dark:text-emerald-400 shadow-xs shadow-emerald-500/10"
      : accent === "amber"
        ? "bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 text-amber-500 dark:text-amber-400 shadow-xs shadow-amber-500/10"
        : accent === "rose"
          ? "bg-gradient-to-br from-rose-500/20 to-pink-500/10 border border-rose-500/30 text-rose-500 dark:text-rose-400 shadow-xs shadow-rose-500/10"
          : "bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 text-foreground";

  const topBarGrad =
    accent === "emerald"
      ? "from-emerald-500 via-teal-400 to-transparent"
      : accent === "amber"
        ? "from-amber-500 via-yellow-400 to-transparent"
        : accent === "rose"
          ? "from-rose-500 via-pink-400 to-transparent"
          : "from-primary/50 via-primary/20 to-transparent";

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3 }}
      className="h-full"
    >
      <Card className="group relative h-full overflow-hidden transition-all duration-300">
        {/* Permanent subtle accent line at top */}
        <div
          className={`pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r ${topBarGrad}`}
          aria-hidden
        />
        <CardHeader className="pb-2 pt-5">
          <div className="flex items-center justify-between">
            <CardDescription className="text-xs font-medium tracking-wide uppercase text-muted-foreground/90">
              {label}
            </CardDescription>
            <span
              className={`grid size-8 place-items-center rounded-lg ${accentIconBg} transition-transform duration-200 group-hover:scale-105`}
            >
              <Icon className="size-4" aria-hidden />
            </span>
          </div>
          <CardTitle className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
            {value}
          </CardTitle>
        </CardHeader>
        {sub && (
          <CardContent className="pt-0 pb-4">
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
  const isRunning = batch.status === "RUNNING";

  return (
    <section aria-label="Headline KPIs" className="space-y-3">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          index={0}
          icon={Wallet}
          label="Total Recovered"
          value={<AnimatedINR value={kpis.totalRecovered} />}
          sub={
            <>
              across{" "}
              <span className="font-medium text-foreground">
                {formatNumber(batch.debtorCount)}
              </span>{" "}
              debtors
            </>
          }
        />
        <KpiCard
          index={1}
          icon={TrendingUp}
          label="Incremental vs Holdout"
          accent={positiveInc ? "emerald" : "rose"}
          value={
            <AnimatedINR
              value={Math.abs(kpis.incrementalRupees)}
              prefix={positiveInc ? "+" : "−"}
            />
          }
          sub={
            <span
              className={
                positiveInc
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }
            >
              {positiveInc ? "▲" : "▼"}{" "}
              <AnimatedPct value={Math.abs(kpis.incrementalPct)} /> lift over
              holdout baseline
            </span>
          }
        />
        <KpiCard
          index={2}
          icon={Scale}
          label="Pre-registered Holdout"
          value={<AnimatedPct value={kpis.holdoutRatio * 100} digits={0} />}
          sub={
            <>
              treated{" "}
              <span className="font-medium text-foreground">
                {formatNumber(kpis.treatedN)}
              </span>{" "}
              · holdout{" "}
              <span className="font-medium text-foreground">
                {formatNumber(kpis.holdoutN)}
              </span>
            </>
          }
        />
        <motion.div
          initial={{ opacity: 0, y: 14, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, delay: 0.21, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ y: -3 }}
          className="h-full"
        >
          <Card className="group relative h-full overflow-hidden transition-all duration-300">
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-emerald-500 via-teal-400 to-transparent"
              aria-hidden
            />
            <CardHeader className="pb-2 pt-5">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs font-medium tracking-wide uppercase text-muted-foreground/90">
                  Batch Status
                </CardDescription>
                <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-muted to-muted/50 border border-border text-foreground transition-transform duration-200 group-hover:scale-105">
                  <Activity className="size-4" aria-hidden />
                </span>
              </div>
              <div className="flex items-center gap-2 pt-1.5">
                <Badge variant="outline" className={`px-2.5 py-0.5 text-xs font-semibold ${statusVariant[batch.status]}`}>
                  {isRunning && (
                    <span
                      className="mr-1.5 inline-block size-2 rounded-full bg-emerald-500 animate-pulse shadow-xs shadow-emerald-500/50"
                      aria-hidden
                    />
                  )}
                  {batch.status}
                </Badge>
                <span className="text-xs font-medium text-muted-foreground">
                  {batch.mandateLevel} mandate
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-1 pb-4">
              <div className="text-xs text-muted-foreground">
                Started{" "}
                <span className="font-medium text-foreground">
                  {new Date(batch.startedAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
