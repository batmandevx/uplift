"use client";

import {
  CartesianGrid,
  ReferenceLine,
  Label,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
  type TooltipProps,
  Cell,
  LabelList,
} from "recharts";
import { GitGraph, TrendingUp } from "lucide-react";
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

function statusColor(status: string): string {
  if (status === "RUNNING") return "var(--chart-2)"; // teal
  if (status === "SEALED") return "var(--chart-1)"; // orange/amber
  return "var(--muted-foreground)";
}

function ScatterTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;
  const row = (payload[0]?.payload ?? undefined) as
    | (BatchComparisonRow & { shortName: string })
    | undefined;
  if (!row) return null;
  const positive = row.incrementalRupees >= 0;
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-md">
      <div className="mb-1 font-medium">{row.batchName}</div>
      <div className="flex items-center gap-2 text-muted-foreground">
        <span>{row.status}</span>
        <span>·</span>
        <span>{row.mandateLevel}</span>
        <span>·</span>
        <span>{row.debtorCount} debtors</span>
      </div>
      <div className="mt-1.5 space-y-0.5">
        <div className="flex items-center justify-between gap-4">
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

export function BatchScatterPlot() {
  const { data, isLoading, isError, error, refetch } = useBatchComparison();

  const chartData = (data ?? []).map((d) => ({
    ...d,
    shortName: d.batchName.replace(/Q[234]-\d{4}-NPL-/, "").replace(/-Cohort-/, ""),
  }));

  // Quadrant thresholds: median incremental + median lift
  const xMedian = chartData.length
    ? [...chartData].map((d) => d.incrementalRupees).sort((a, b) => a - b)[Math.floor(chartData.length / 2)]
    : 0;
  const yMedian = chartData.length
    ? [...chartData].map((d) => d.liftPct).sort((a, b) => a - b)[Math.floor(chartData.length / 2)]
    : 0;

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <GitGraph className="size-4 text-chart-3" aria-hidden />
            <CardTitle>Incremental vs Lift</CardTitle>
          </div>
          {data && data.length > 0 && (
            <Badge variant="outline" className="text-[10px] gap-1">
              <TrendingUp className="size-3" aria-hidden />
              bubble = debtor count
            </Badge>
          )}
        </div>
        <CardDescription>
          Each bubble is a batch. X = incremental recovery (₹), Y = lift % over
          holdout. Bubble size = debtor count. Running batch highlighted.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isError ? (
          <QueryError message={error?.message} onRetry={() => refetch()} />
        ) : isLoading || !data ? (
          <Skeleton className="h-[280px] w-full rounded-md" />
        ) : chartData.length === 0 ? (
          <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
            No batches to plot.
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="h-[280px] w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart
                margin={{ top: 16, right: 24, left: 8, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                {/* Quadrant dividers (median lines) */}
                <ReferenceLine
                  x={xMedian}
                  stroke="var(--border)"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                />
                <ReferenceLine
                  y={yMedian}
                  stroke="var(--border)"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                />
                {/* Quadrant labels */}
                <ReferenceLine
                  y={yMedian}
                  stroke="transparent"
                  label={{
                    value: "★ Best",
                    position: "insideTopRight",
                    fill: "var(--chart-2)",
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                />
                <ReferenceLine
                  y={yMedian}
                  stroke="transparent"
                  label={{
                    value: "Niche — high lift, low volume",
                    position: "insideTopLeft",
                    fill: "var(--chart-3)",
                    fontSize: 9,
                  }}
                />
                <ReferenceLine
                  y={yMedian}
                  stroke="transparent"
                  label={{
                    value: "Low impact",
                    position: "insideBottomLeft",
                    fill: "var(--muted-foreground)",
                    fontSize: 9,
                  }}
                />
                <XAxis
                  type="number"
                  dataKey="incrementalRupees"
                  name="Incremental"
                  tickFormatter={(v) =>
                    v >= 100000
                      ? `${(v / 100000).toFixed(1)}L`
                      : v >= 1000
                        ? `${(v / 1000).toFixed(0)}K`
                        : `${v}`
                  }
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                  label={{
                    value: "Incremental recovery (₹)",
                    position: "insideBottom",
                    offset: -4,
                    style: { fontSize: 10, fill: "var(--muted-foreground)" },
                  }}
                />
                <YAxis
                  type="number"
                  dataKey="liftPct"
                  name="Lift"
                  unit="%"
                  tickFormatter={(v) => `${v.toFixed(0)}%`}
                  tickLine={false}
                  axisLine={false}
                  width={48}
                  tick={{ fontSize: 11 }}
                  label={{
                    value: "Lift %",
                    angle: -90,
                    position: "insideLeft",
                    offset: 16,
                    style: { fontSize: 10, fill: "var(--muted-foreground)" },
                  }}
                />
                <ZAxis
                  type="number"
                  dataKey="debtorCount"
                  range={[60, 400]}
                  name="Debtors"
                />
                <Tooltip content={<ScatterTooltip />} cursor={{ strokeDasharray: "3 3" }} />
                <Scatter
                  data={chartData}
                  isAnimationActive
                  animationDuration={600}
                >
                  {chartData.map((entry) => (
                    <Cell
                      key={entry.batchId}
                      fill={statusColor(entry.status)}
                      fillOpacity={
                        entry.status === "RUNNING" ? 0.85 : 0.6
                      }
                      stroke={
                        entry.status === "RUNNING"
                          ? "var(--foreground)"
                          : "transparent"
                      }
                      strokeWidth={entry.status === "RUNNING" ? 2 : 0}
                    />
                  ))}
                  <LabelList
                    dataKey="shortName"
                    position="top"
                    style={{
                      fontSize: 10,
                      fill: "var(--muted-foreground)",
                      fontWeight: 500,
                    }}
                    offset={12}
                  />
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
