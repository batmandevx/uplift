"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ErrorBar,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";
import { FlaskConical } from "lucide-react";
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
import { useHoldoutComparison } from "./queries";
import { formatINR, formatNumber } from "@/lib/format";

function ChartTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;
  const p = payload[0].payload as {
    group: string;
    mean: number;
    ciLo: number;
    ciHi: number;
    n: number;
    total: number;
  };
  return (
    <div className="glass rounded-lg border border-border/60 bg-popover/95 p-3 text-xs shadow-xl backdrop-blur-md">
      <div className="mb-1.5 font-bold text-foreground flex items-center gap-1.5">
        <span className={`size-2 rounded-full ${p.group === "Treated" ? "bg-emerald-500" : "bg-amber-500"}`} />
        <span>{p.group} Cohort</span>
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4 text-muted-foreground">
          <span>Mean:</span>
          <span className="font-semibold text-foreground tabular-nums">{formatINR(p.mean)}</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-muted-foreground">
          <span>95% CI:</span>
          <span className="font-medium text-foreground tabular-nums">
            {formatINR(p.ciLo)} – {formatINR(p.ciHi)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 text-muted-foreground border-t border-border/40 pt-1 mt-1">
          <span>Sample size:</span>
          <span className="font-medium text-foreground tabular-nums">{formatNumber(p.n)}</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-muted-foreground">
          <span>Total:</span>
          <span className="font-semibold text-foreground tabular-nums">{formatINR(p.total, { compact: true })}</span>
        </div>
      </div>
    </div>
  );
}

export function HoldoutComparisonChart({ batchId }: { batchId?: string }) {
  const { data, isLoading, isError, error, refetch } =
    useHoldoutComparison(batchId);

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FlaskConical className="size-4 text-chart-1" aria-hidden />
            <CardTitle>Holdout Comparison</CardTitle>
          </div>
          <Badge variant="outline" className="gap-1">
            Wilson 95% CI
          </Badge>
        </div>
        <CardDescription>
          Mean recovery per debtor — treated cohort vs pre-registered holdout.
          Error bars show the Wilson score 95% confidence interval.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isError ? (
          <QueryError message={error?.message} onRetry={() => refetch()} />
        ) : isLoading || !data ? (
          <Skeleton className="h-[260px] w-full rounded-md" />
        ) : (
          <>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    {
                      group: "Treated",
                      mean: data.treated.mean,
                      ciLo: data.treated.ci[0],
                      ciHi: data.treated.ci[1],
                      errorY: [
                        Math.max(0, data.treated.mean - data.treated.ci[0]),
                        Math.max(0, data.treated.ci[1] - data.treated.mean),
                      ],
                      n: data.treated.n,
                      total: data.treated.total,
                      fill: "var(--chart-1)",
                    },
                    {
                      group: "Holdout",
                      mean: data.holdout.mean,
                      ciLo: data.holdout.ci[0],
                      ciHi: data.holdout.ci[1],
                      errorY: [
                        Math.max(0, data.holdout.mean - data.holdout.ci[0]),
                        Math.max(0, data.holdout.ci[1] - data.holdout.mean),
                      ],
                      n: data.holdout.n,
                      total: data.holdout.total,
                      fill: "var(--chart-4)",
                    },
                  ]}
                  margin={{ top: 16, right: 16, left: 8, bottom: 4 }}
                  barCategoryGap="28%"
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="group" tickLine={false} axisLine={false} />
                  <YAxis
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`}
                    tickLine={false}
                    axisLine={false}
                    width={56}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.4 }} />
                  <Bar dataKey="mean" radius={[6, 6, 0, 0]} isAnimationActive>
                    <ErrorBar
                      dataKey="errorY"
                      width={5}
                      strokeWidth={1.5}
                      stroke="var(--foreground)"
                      isAnimationActive={false}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
              <div className="rounded-md border bg-muted/40 p-3">
                <div className="mb-1 flex items-center gap-2 font-medium">
                  <span className="size-2.5 rounded-full bg-[var(--chart-1)]" aria-hidden />
                  Treated mean
                </div>
                <div className="tabular-nums text-foreground">
                  {formatINR(data.treated.mean)}{" "}
                  <span className="text-muted-foreground">
                    [95% CI: {formatINR(data.treated.ci[0])} – {formatINR(data.treated.ci[1])}]
                  </span>
                </div>
              </div>
              <div className="rounded-md border bg-muted/40 p-3">
                <div className="mb-1 flex items-center gap-2 font-medium">
                  <span className="size-2.5 rounded-full bg-[var(--chart-4)]" aria-hidden />
                  Holdout mean
                </div>
                <div className="tabular-nums text-foreground">
                  {formatINR(data.holdout.mean)}{" "}
                  <span className="text-muted-foreground">
                    [95% CI: {formatINR(data.holdout.ci[0])} – {formatINR(data.holdout.ci[1])}]
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
