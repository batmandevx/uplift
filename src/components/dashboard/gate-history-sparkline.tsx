"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  YAxis,
  Tooltip,
  type TooltipProps,
} from "recharts";
import { useGateHistory } from "./queries";
import type { GateState } from "@/lib/dashboard-types";

// Map gate state → numeric value for the sparkline (higher = more blocking).
const STATE_VALUE: Record<GateState, number> = {
  passing: 0,
  active: 1,
  pending: 2,
  blocking: 3,
};

function SparkTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;
  const p = payload[0]?.payload as { at: string; state: string; label: string } | undefined;
  if (!p) return null;
  const d = new Date(p.at);
  const ist = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
  const hh = String(ist.getUTCHours()).padStart(2, "0");
  const mm = String(ist.getUTCMinutes()).padStart(2, "0");
  return (
    <div className="rounded-md border bg-popover px-2 py-1 text-[10px] shadow-md">
      <div className="font-medium tabular-nums">{hh}:{mm} IST</div>
      <div className="text-muted-foreground capitalize">{p.state}</div>
    </div>
  );
}

// Renders a tiny 24h sparkline for a single gate, showing when it flipped
// state. Color reflects the latest state. Height is fixed (28px).
export function GateHistorySparkline({
  batchId,
  gateKey,
  latestState,
}: {
  batchId?: string;
  gateKey: string;
  latestState: GateState;
}) {
  const { data } = useGateHistory(batchId, 24);

  const gateData = data?.gates.find((g) => g.gateKey === gateKey);
  const points = (gateData?.points ?? []).map((p) => ({
    at: p.at,
    state: p.state,
    value: STATE_VALUE[p.state as GateState] ?? 0,
  }));

  if (points.length < 2) {
    return (
      <div className="h-7 w-16 shrink-0 rounded bg-muted/40" aria-hidden />
    );
  }

  const color =
    latestState === "blocking"
      ? "var(--chart-5)"
      : latestState === "pending"
        ? "var(--chart-4)"
        : latestState === "active"
          ? "var(--muted-foreground)"
          : "var(--chart-2)";

  return (
    <div className="h-7 w-16 shrink-0" aria-hidden>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={points}
          margin={{ top: 2, right: 1, left: 1, bottom: 2 }}
        >
          <YAxis
            domain={[-0.5, 3.5]}
            hide
          />
          <Tooltip content={<SparkTooltip />} cursor={false} />
          <Line
            type="stepAfter"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
