"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";
import { BarChart3 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryError } from "./query-error";
import { useRecoveryDistribution } from "./queries";

function ChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-md">
      <div className="mb-1 font-medium">Recovery bucket: {label}</div>
      {payload.map((p) => (
        <div key={p.dataKey as string} className="flex items-center gap-2">
          <span
            className="size-2.5 rounded-full"
            style={{ backgroundColor: p.color as string }}
            aria-hidden
          />
          <span className="capitalize text-muted-foreground">{p.name}</span>
          <span className="ml-auto font-medium tabular-nums text-foreground">
            {p.value as number} debtors
          </span>
        </div>
      ))}
    </div>
  );
}

export function RecoveryDistributionChart({ batchId }: { batchId?: string }) {
  const { data, isLoading, isError, error, refetch } =
    useRecoveryDistribution(batchId);

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <BarChart3 className="size-4 text-chart-2" aria-hidden />
          <CardTitle>Recovery Distribution</CardTitle>
        </div>
        <CardDescription>
          Per-debtor recovery %, bucketed into 5 bands. Treated overlay vs
          holdout overlay.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isError ? (
          <QueryError message={error?.message} onRetry={() => refetch()} />
        ) : isLoading || !data ? (
          <Skeleton className="h-[260px] w-full rounded-md" />
        ) : (
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 10, right: 16, left: 8, bottom: 4 }}
              >
                <defs>
                  <linearGradient id="treatedFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.04} />
                  </linearGradient>
                  <linearGradient id="holdoutFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-4)" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="var(--chart-4)" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="bucket" tickLine={false} axisLine={false} />
                <YAxis
                  tickFormatter={(v) => `${v}`}
                  tickLine={false}
                  axisLine={false}
                  width={32}
                />
                <Tooltip content={<ChartTooltip />} />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: 12, paddingTop: 6 }}
                />
                <Area
                  type="monotone"
                  dataKey="treated"
                  name="Treated"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  fill="url(#treatedFill)"
                  isAnimationActive
                />
                <Area
                  type="monotone"
                  dataKey="holdout"
                  name="Holdout"
                  stroke="var(--chart-4)"
                  strokeWidth={2}
                  fill="url(#holdoutFill)"
                  isAnimationActive
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
