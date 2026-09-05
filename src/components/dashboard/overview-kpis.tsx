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
      ? "text-emerald-600 dark:text-emerald-400"
      : accent === "amber"
        ? "text-amber-600 dark:text-amber-400"
        : accent === "rose"
          ? "text-rose-600 dark:text-rose-400"
          : "text-foreground";
  const accentBg =
    accent === "emerald"
      ? "bg-emerald-500/10 dark:bg-emerald-500/15"
      : accent === "amber"
        ? "bg-amber-500/10 dark:bg-amber-500/15"
        : accent === "rose"
          ? "bg-rose-500/10 dark:bg-rose-500/15"
          : "bg-muted";

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3 }}
      className="h-full"
    >
      <Card className="group relative h-full overflow-hidden transition-shadow duration-300 hover:shadow-lg">
        {/* accent gradient sheen on hover */}
        <div
          className={`pointer-events-none absolute inset-x-0 -top-px h-px opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${accent === "emerald" ? "bg-gradient-to-r from-transparent via-emerald-400 to-transparent" : accent === "amber" ? "bg-gradient-to-r from-transparent via-amber-400 to-transparent" : accent === "rose" ? "bg-gradient-to-r from-transparent via-rose-400 to-transparent" : "bg-gradient-to-r from-transparent via-foreground/30 to-transparent"}`}
          aria-hidden
        />
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardDescription className="text-xs">{label}</CardDescription>
            <span
              className={`grid size-7 place-items-center rounded-lg ${accentBg} ${accentText} ${glow ? "glow-emerald" : ""}`}
              style={glow ? { color: "var(--chart-2)" } : undefined}
            >
              <Icon className="size-3.5" aria-hidden />
            </span>
          </div>
          <CardTitle className="text-2xl font-semibold tracking-tight sm:text-3xl">
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
          <Card className="group relative h-full overflow-hidden transition-shadow duration-300 hover:shadow-lg">
            <div
              className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              aria-hidden
            />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs">
                  Batch Status
                </CardDescription>
                <span className="grid size-7 place-items-center rounded-lg bg-muted text-foreground">
                  <Activity className="size-3.5" aria-hidden />
                </span>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Badge variant="outline" className={statusVariant[batch.status]}>
                  {isRunning && (
                    <span
                      className="mr-1 inline-block size-1.5 rounded-full bg-emerald-500 glow-emerald"
                      style={{ color: "var(--chart-2)" }}
                      aria-hidden
                    />
                  )}
                  {batch.status}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {batch.mandateLevel} mandate
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xs text-muted-foreground">
                Started{" "}
                {new Date(batch.startedAt).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
