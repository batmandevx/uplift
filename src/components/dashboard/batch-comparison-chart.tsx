"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
  type TooltipProps,
} from "recharts";
import { GitCompareArrows } from "lucide-react";
import { motion } from "framer-motion";
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
import { useBatchComparison } from "./queries";
import { formatINR } from "@/lib/format";
import type { BatchComparisonRow } from "@/lib/dashboard-types";

function ChartTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0]?.payload as BatchComparisonRow | undefined;
  if (!row) return null;
  const positive = row.incrementalRupees >= 0;
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-md">
      <div className="mb-1 font-medium">{row.batchName}</div>
      <div className="flex items-center gap-2 text-muted-foreground">
        <span>{row.status}</span>
        <span>·</span>
        <span>{row.mandateLevel}</span>
      </div>
      <div className="mt-1.5 space-y-0.5">
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">Treated mean</span>
          <span className="font-medium tabular-nums text-foreground">
            {formatINR(row.treatedMean, { compact: true })}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">Holdout mean</span>
          <span className="font-medium tabular-nums text-foreground">
            {formatINR(row.holdoutMean, { compact: true })}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 border-t pt-1">
          <span className="text-muted-foreground">Incremental</span>
          <span
            className={`font-semibold tabular-nums ${
              positive
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {positive ? "+" : "−"}
            {formatINR(Math.abs(row.incrementalRupees), { compact: true })}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">Lift</span>
          <span
            className={`font-medium tabular-nums ${
              positive
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {positive ? "▲" : "▼"} {Math.abs(row.liftPct).toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}

export function BatchComparisonChart() {
  const { data, isLoading, isError, error, refetch } = useBatchComparison();

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <GitCompareArrows className="size-4 text-chart-1" aria-hidden />
            <CardTitle>Batch Comparison</CardTitle>
          </div>
          {data && data.length > 0 && (
            <Badge variant="outline" className="text-[10px]">
              {data.length} batches
            </Badge>
          )}
        </div>
        <CardDescription>
          Incremental recovery vs. holdout across all batches. Sealed batches
          (ground truth) benchmark the running batch.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isError ? (
          <QueryError message={error?.message} onRetry={() => refetch()} />
        ) : isLoading || !data ? (
          <Skeleton className="h-[280px] w-full rounded-md" />
        ) : data.length === 0 ? (
          <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
            No batches to compare.
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="h-[280px] w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 10, right: 16, left: 8, bottom: 4 }}
                barGap={4}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="batchName"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10 }}
                  interval={0}
                  angle={-12}
                  textAnchor="end"
                  height={50}
                />
                <YAxis
                  tickFormatter={(v) =>
                    v >= 100000
                      ? `${(v / 100000).toFixed(1)}L`
                      : v >= 1000
                        ? `${(v / 1000).toFixed(0)}K`
                        : `${v}`
                  }
                  tickLine={false}
                  axisLine={false}
                  width={48}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.3 }} />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: 12, paddingTop: 6 }}
                />
                <ReferenceLine y={0} stroke="var(--border)" />
                <Bar
                  dataKey="treatedMean"
                  name="Treated mean"
                  fill="var(--chart-1)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={42}
                />
                <Bar
                  dataKey="holdoutMean"
                  name="Holdout mean"
                  fill="var(--chart-4)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={42}
                />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
