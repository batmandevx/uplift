"use client";

import { motion } from "framer-motion";
import {
  MessageSquare,
  Phone,
  PhoneCall,
  Gavel,
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
import { useEscalationFunnel, useComplianceRules } from "./queries";
import { formatNumber } from "@/lib/format";

const RUNG_ICONS: LucideIcon[] = [MessageSquare, Phone, PhoneCall, Gavel];
const RUNG_TONES = [
  "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  "bg-orange-500/15 text-orange-700 dark:text-orange-300",
  "bg-rose-500/15 text-rose-700 dark:text-rose-300",
];

export function EscalationLadder({ batchId }: { batchId?: string }) {
  const funnel = useEscalationFunnel(batchId);
  const rules = useComplianceRules(batchId);

  const rungs = rules.data?.ladder ?? [];
  const counts = funnel.data ?? [];

  const total = counts.reduce((s, r) => s + (r.count ?? 0), 0) || 1;
  const maxCount = Math.max(1, ...counts.map((c) => c.count ?? 0));

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Gavel className="size-4 text-chart-3" aria-hidden />
          <CardTitle>Escalation Ladder</CardTitle>
        </div>
        <CardDescription>
          Debtors per rung. Rungs ≥ {rules.data?.humanApprovalRequiredFromRung ?? 2}{" "}
          require a human-approval gate before transition.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {funnel.isError ? (
          <QueryError message={funnel.error?.message} onRetry={() => funnel.refetch()} />
        ) : funnel.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-md" />
            ))}
          </div>
        ) : (
          <ol className="space-y-2" aria-label="Escalation ladder rungs">
            {counts.map((r, i) => {
              const Icon = RUNG_ICONS[i % RUNG_ICONS.length];
              const tone = RUNG_TONES[i % RUNG_TONES.length];
              const meta = rungs.find((x) => x.level === r.level);
              const pctOfMax = Math.round(((r.count ?? 0) / maxCount) * 100);
              const pctOfTotal = Math.round(((r.count ?? 0) / total) * 100);
              const needsGate =
                (rules.data?.humanApprovalRequiredFromRung ?? 2) <= r.level;
              return (
                <motion.li
                  key={r.level}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.06 }}
                  className="rounded-lg border bg-card/60 p-3"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`grid size-8 shrink-0 place-items-center rounded-md ${tone}`}
                      aria-hidden
                    >
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-muted-foreground">
                            Rung {r.level}
                          </span>
                          <span className="truncate text-sm font-medium">
                            {r.label}
                          </span>
                          {needsGate && (
                            <Badge
                              variant="outline"
                              className="border-amber-300/50 bg-amber-100/70 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                            >
                              Gate
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm font-semibold tabular-nums">
                          {formatNumber(r.count ?? 0)}
                          <span className="ml-1 text-[11px] font-normal text-muted-foreground">
                            ({pctOfTotal}%)
                          </span>
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-foreground/70 transition-[width] duration-500"
                          style={{ width: `${pctOfMax}%` }}
                          aria-hidden
                        />
                      </div>
                      {meta?.description && (
                        <p className="mt-1 truncate text-[11px] text-muted-foreground">
                          {meta.description}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
