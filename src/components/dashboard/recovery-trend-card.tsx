"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  YAxis,
  type TooltipProps,
} from "recharts";
import { TrendingUp } from "lucide-react";
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
import { useRecoveryTrend } from "./queries";
import { formatINR } from "@/lib/format";

function SparkTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;
  const p = payload[0]?.payload as {
    day: string;
    cumulativeRecovered: number;
    dailyRecovered: number;
    attempts: number;
  } | null;
  if (!p) return null;
  return (
    <div className="glass rounded-lg border border-border/60 bg-popover/95 p-2.5 text-xs shadow-xl backdrop-blur-md">
      <div className="font-bold tabular-nums text-foreground mb-1">{p.day}</div>
      <div className="space-y-0.5">
        <div className="flex items-center justify-between gap-3 text-muted-foreground">
          <span>Cumulative:</span>
          <span className="font-semibold tabular-nums text-foreground">
            {formatINR(p.cumulativeRecovered, { compact: true })}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 text-muted-foreground">
          <span>Daily:</span>
          <span className="font-semibold tabular-nums text-emerald-500 dark:text-emerald-400">
            +{formatINR(p.dailyRecovered, { compact: true })}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 text-muted-foreground border-t border-border/40 pt-1 mt-1">
          <span>Attempts:</span>
          <span className="font-medium tabular-nums text-foreground">{p.attempts}</span>
        </div>
      </div>
    </div>
  );
}

export function RecoveryTrendCard({ batchId }: { batchId?: string }) {
  const { data, isLoading, isError, error, refetch } = useRecoveryTrend(
    batchId,
    14,
  );

  const points = data?.points ?? [];
  const totalDaily = points.reduce((a, p) => a + p.dailyRecovered, 0);
  const peakDay = points.reduce(
    (best, p) => (p.dailyRecovered > best.dailyRecovered ? p : best),
    { day: "—", dailyRecovered: 0 } as { day: string; dailyRecovered: number },
  );

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden />
            <CardTitle>Recovery Trend</CardTitle>
          </div>
          {data && (
            <Badge variant="outline" className="text-[10px]">
              14 days
            </Badge>
          )}
        </div>
        <CardDescription>
          Cumulative recovery over the last 14 days for{" "}
          <span className="font-medium text-foreground">
            {data?.batchName ?? "selected batch"}
          </span>
          .
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isError ? (
          <QueryError message={error?.message} onRetry={() => refetch()} />
        ) : isLoading || !data ? (
          <Skeleton className="h-[140px] w-full rounded-md" />
        ) : points.length === 0 ? (
          <div className="flex h-[140px] items-center justify-center text-sm text-muted-foreground">
            No recovery attempts in the last 14 days.
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="space-y-3"
          >
            <div className="h-[140px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={points}
                  margin={{ top: 4, right: 4, left: 4, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="var(--chart-2)"
                        stopOpacity={0.5}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--chart-2)"
                        stopOpacity={0.04}
                      />
                    </linearGradient>
                  </defs>
                  <YAxis hide domain={["dataMin", "dataMax"]} />
                  <Tooltip content={<SparkTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="cumulativeRecovered"
                    stroke="var(--chart-2)"
                    strokeWidth={2}
                    fill="url(#trendFill)"
                    isAnimationActive
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg border bg-card/40 p-2">
                <div className="text-[10px] uppercase text-muted-foreground">
                  14-day total
                </div>
                <div className="text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                  +{formatINR(totalDaily, { compact: true })}
                </div>
              </div>
              <div className="rounded-lg border bg-card/40 p-2">
                <div className="text-[10px] uppercase text-muted-foreground">
                  Peak day
                </div>
                <div className="text-sm font-semibold tabular-nums">
                  +{formatINR(peakDay.dailyRecovered, { compact: true })}
                </div>
              </div>
              <div className="rounded-lg border bg-card/40 p-2">
                <div className="text-[10px] uppercase text-muted-foreground">
                  Attempts
                </div>
                <div className="text-sm font-semibold tabular-nums">
                  {points.reduce((a, p) => a + p.attempts, 0)}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
