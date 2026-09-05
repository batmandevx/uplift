"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radio,
  PauseCircle,
  PlayCircle,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Shield,
  Zap,
  Activity,
  Calendar,
  Layers,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PaymentRail {
  id: string;
  name: string;
  status: "ACTIVE" | "PAUSED" | "DEGRADED";
  successRate: number;
  zScore: number;
  latencyMs: number;
  maintenanceWindow?: string;
  pendingQueuedRetries: number;
}

const INITIAL_RAILS: PaymentRail[] = [
  {
    id: "upi",
    name: "UPI Rail (NPCI)",
    status: "ACTIVE",
    successRate: 99.4,
    zScore: 0.4,
    latencyMs: 380,
    pendingQueuedRetries: 0,
  },
  {
    id: "hdfc-nb",
    name: "HDFC NetBanking",
    status: "PAUSED",
    successRate: 42.1,
    zScore: 3.4,
    latencyMs: 1840,
    maintenanceWindow: "01:00 - 02:30 IST (Core Banking Upgrade)",
    pendingQueuedRetries: 34,
  },
  {
    id: "icici-axis",
    name: "ICICI & Axis NetBanking",
    status: "ACTIVE",
    successRate: 98.9,
    zScore: 0.8,
    latencyMs: 510,
    pendingQueuedRetries: 0,
  },
  {
    id: "cards-gateway",
    name: "Cards Gateway (Visa/Mastercard)",
    status: "ACTIVE",
    successRate: 99.2,
    zScore: 0.5,
    latencyMs: 420,
    pendingQueuedRetries: 0,
  },
];

export function RadarPacingPanel() {
  const [rails, setRails] = React.useState<PaymentRail[]>(INITIAL_RAILS);
  const [isSimulatingHdfcOutage, setIsSimulatingHdfcOutage] = React.useState(true);

  const pausedRail = rails.find((r) => r.status === "PAUSED");
  const totalPausedRetries = rails.reduce((acc, r) => acc + r.pendingQueuedRetries, 0);

  function toggleHdfcMaintenance() {
    if (isSimulatingHdfcOutage) {
      // Resume
      setRails((prev) =>
        prev.map((r) =>
          r.id === "hdfc-nb"
            ? {
                ...r,
                status: "ACTIVE",
                successRate: 98.6,
                zScore: 0.7,
                latencyMs: 540,
                maintenanceWindow: undefined,
                pendingQueuedRetries: 0,
              }
            : r,
        ),
      );
      setIsSimulatingHdfcOutage(false);
      toast.success("Radar: HDFC Rail Resumed", {
        description: "Maintenance window passed. 34 retries released in uptime-windowed order.",
      });
    } else {
      // Pause
      setRails((prev) =>
        prev.map((r) =>
          r.id === "hdfc-nb"
            ? {
                ...r,
                status: "PAUSED",
                successRate: 41.2,
                zScore: 3.5,
                latencyMs: 1920,
                maintenanceWindow: "Simulated Bank Maintenance Window",
                pendingQueuedRetries: 34,
              }
            : r,
        ),
      );
      setIsSimulatingHdfcOutage(true);
      toast.warning("Radar: Degradation Detected (Z-Score > 3.0)", {
        description: "Outgoing retries automatically PAUSED to preserve attempt budget.",
      });
    }
  }

  return (
    <Card className="h-full border-cyan-500/20 shadow-xl overflow-hidden relative">
      {/* Top ambient accent line */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400" />
      
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-teal-500/10 text-cyan-400 border border-cyan-500/30">
              <Radio className="size-4 animate-pulse" />
            </span>
            <div>
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <span>Radar: Degradation-Aware Pacing</span>
                {pausedRail && (
                  <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-400 text-[10px] uppercase font-mono">
                    rail_status = PAUSED
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Real-time bank calendar & Z-score baseline monitoring (σ = 3.00 threshold)
              </CardDescription>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={toggleHdfcMaintenance}
            className="h-8 gap-1.5 text-xs font-medium border-cyan-500/30 hover:bg-cyan-500/10 text-cyan-400 active:scale-98"
          >
            {isSimulatingHdfcOutage ? (
              <>
                <PlayCircle className="size-3.5 text-emerald-400" />
                <span>Resume HDFC Rail</span>
              </>
            ) : (
              <>
                <PauseCircle className="size-3.5 text-amber-400" />
                <span>Simulate Bank Outage</span>
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Highlight Banner */}
        <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-3 text-xs">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-2.5">
              <span className="grid size-7 place-items-center rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Zap className="size-3.5" />
              </span>
              <div>
                <div className="font-semibold text-foreground">Uptime Pacing</div>
                <div className="text-[11px] text-muted-foreground">Zero spam into outages</div>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="grid size-7 place-items-center rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Shield className="size-3.5" />
              </span>
              <div>
                <div className="font-semibold text-foreground">Budget Preserved</div>
                <div className="text-[11px] text-muted-foreground">{totalPausedRetries} attempts saved</div>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="grid size-7 place-items-center rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Activity className="size-3.5" />
              </span>
              <div>
                <div className="font-semibold text-foreground">Z-Score Protection</div>
                <div className="text-[11px] text-muted-foreground">Rolling 5m sliding window</div>
              </div>
            </div>
          </div>
        </div>

        {/* Rails List */}
        <div className="space-y-2">
          {rails.map((rail) => {
            const isPaused = rail.status === "PAUSED";
            return (
              <motion.div
                key={rail.id}
                layout
                className={`rounded-lg border p-3 text-xs transition-all duration-200 ${
                  isPaused
                    ? "border-amber-500/40 bg-amber-500/5 shadow-xs"
                    : "border-border/60 bg-card/40 hover:bg-card/70"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`size-2 rounded-full ${
                        isPaused ? "bg-amber-500 animate-ping" : "bg-emerald-500"
                      }`}
                    />
                    <span className="font-semibold text-foreground text-sm">{rail.name}</span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-mono ${
                        isPaused
                          ? "border-amber-500/40 bg-amber-500/10 text-amber-400 font-bold"
                          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      }`}
                    >
                      {rail.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <span>
                      Success:{" "}
                      <strong className={`tabular-nums ${isPaused ? "text-rose-400" : "text-emerald-400"}`}>
                        {rail.successRate}%
                      </strong>
                    </span>
                    <span>·</span>
                    <span>
                      Z-Score:{" "}
                      <strong className={`tabular-nums ${rail.zScore >= 3 ? "text-amber-400" : "text-foreground"}`}>
                        {rail.zScore.toFixed(1)}σ
                      </strong>
                    </span>
                    <span>·</span>
                    <span className="tabular-nums font-mono text-[11px]">{rail.latencyMs}ms</span>
                  </div>
                </div>

                {isPaused && (
                  <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-amber-500/20 pt-2 text-[11px] text-amber-300">
                    <div className="flex items-center gap-1.5">
                      <Clock className="size-3" />
                      <span>{rail.maintenanceWindow}</span>
                    </div>
                    <div className="font-semibold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                      [HOLDING {rail.pendingQueuedRetries} RETRIES IN BUFFER]
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
