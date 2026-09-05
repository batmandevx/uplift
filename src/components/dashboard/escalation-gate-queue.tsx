"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldQuestion,
  Check,
  X,
  ArrowRight,
  Clock,
  UserCheck,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QueryError } from "./query-error";
import {
  useEscalationGates,
  useApproveGate,
  useRejectGate,
} from "./queries";
import { formatDateTime } from "@/lib/format";
import { toast } from "sonner";

const RUNG_LABELS = ["Soft Reminder", "Standard Call", "Enhanced Outreach", "Legal Notice Referral"];

function rungLabel(level: number): string {
  return RUNG_LABELS[level] ?? `Rung ${level}`;
}

export function EscalationGateQueue() {
  const { data, isLoading, isError, error, refetch } = useEscalationGates("PENDING");
  const approve = useApproveGate();
  const reject = useRejectGate();

  function onApprove(id: string, debtorToken: string) {
    approve.mutate(id, {
      onSuccess: () =>
        toast.success(`Gate approved`, {
          description: `Debtor ${debtorToken} escalated.`,
        }),
      onError: (e: Error) =>
        toast.error("Approval failed", { description: e.message }),
    });
  }

  function onReject(id: string, debtorToken: string) {
    reject.mutate(id, {
      onSuccess: () =>
        toast.success(`Gate rejected`, {
          description: `Escalation denied for ${debtorToken}.`,
        }),
      onError: (e: Error) =>
        toast.error("Rejection failed", { description: e.message }),
    });
  }

  const pending = data ?? [];

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldQuestion className="size-4 text-amber-600 dark:text-amber-400" aria-hidden />
            <CardTitle>Human-Approval Gate Queue</CardTitle>
          </div>
          {pending.length > 0 && (
            <Badge
              variant="outline"
              className="border-amber-300/50 bg-amber-100/70 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
            >
              {pending.length} pending
            </Badge>
          )}
        </div>
        <CardDescription>
          Escalations to rung ≥ 2 require human sign-off before the next
          outreach is dispatched.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isError ? (
          <QueryError message={error?.message} onRetry={() => refetch()} />
        ) : isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-md" />
            ))}
          </div>
        ) : pending.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-10 text-center">
            <UserCheck className="size-6 text-emerald-600 dark:text-emerald-400" aria-hidden />
            <p className="text-sm font-medium">Queue is clear</p>
            <p className="max-w-xs text-xs text-muted-foreground">
              No escalation requests awaiting human review. All compliant.
            </p>
          </div>
        ) : (
          <ul
            className="max-h-96 space-y-2 overflow-y-auto pr-1 scroll-thin"
            aria-label="Pending escalation gates"
          >
            <AnimatePresence initial={false}>
              {pending.map((g) => (
                <motion.li
                  key={g.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 24 }}
                  transition={{ duration: 0.25 }}
                  className="rounded-lg border bg-card/60 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-medium">
                          {g.debtorToken}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          PENDING
                        </Badge>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                        <span className="rounded bg-muted px-1.5 py-0.5">
                          Rung {g.fromLevel} · {rungLabel(g.fromLevel)}
                        </span>
                        <ArrowRight className="size-3 text-muted-foreground" aria-hidden />
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                          Rung {g.toLevel} · {rungLabel(g.toLevel)}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {g.rationale}
                      </p>
                      <p className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock className="size-3" aria-hidden />
                        Requested {formatDateTime(g.requestedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      className="h-8 gap-1 bg-emerald-600 text-white hover:bg-emerald-600/90"
                      onClick={() => onApprove(g.id, g.debtorToken)}
                      disabled={approve.isPending || reject.isPending}
                      aria-label={`Approve escalation for ${g.debtorToken}`}
                    >
                      <Check className="size-3.5" aria-hidden /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1 text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                      onClick={() => onReject(g.id, g.debtorToken)}
                      disabled={approve.isPending || reject.isPending}
                      aria-label={`Reject escalation for ${g.debtorToken}`}
                    >
                      <X className="size-3.5" aria-hidden /> Reject
                    </Button>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
