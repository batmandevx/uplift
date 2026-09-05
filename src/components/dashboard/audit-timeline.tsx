"use client";

import { motion } from "framer-motion";
import {
  ScrollText,
  ShieldCheck,
  ShieldAlert,
  Lock,
  PhoneCall,
  XCircle,
  Cpu,
  User,
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
import { useAudit } from "./queries";
import { formatDateTime } from "@/lib/format";
import type { AuditEvent, AuditTimelineGroup } from "@/lib/dashboard-types";

const ACTION_META: Record<
  string,
  { icon: LucideIcon; tone: string; dot: string; label: string }
> = {
  BATCH_STARTED: {
    icon: Cpu,
    tone: "text-muted-foreground",
    dot: "bg-muted-foreground",
    label: "Batch started",
  },
  BATCH_SEALED: {
    icon: Lock,
    tone: "text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
    label: "Batch sealed",
  },
  ESCALATION_APPROVED: {
    icon: ShieldCheck,
    tone: "text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
    label: "Escalation approved",
  },
  ESCALATION_REJECTED: {
    icon: XCircle,
    tone: "text-rose-600 dark:text-rose-400",
    dot: "bg-rose-500",
    label: "Escalation rejected",
  },
  STOP_RULE_TRIGGERED: {
    icon: ShieldAlert,
    tone: "text-rose-600 dark:text-rose-400",
    dot: "bg-rose-500",
    label: "Stop rule triggered",
  },
  STOP_PHRASE_NOT_MATCHED: {
    icon: PhoneCall,
    tone: "text-muted-foreground",
    dot: "bg-muted-foreground",
    label: "Phrase not matched",
  },
};

function getMeta(action: string) {
  return (
    ACTION_META[action] ?? {
      icon: ScrollText,
      tone: "text-muted-foreground",
      dot: "bg-muted-foreground",
      label: action.replace(/_/g, " ").toLowerCase(),
    }
  );
}

function groupByDay(events: AuditEvent[]): AuditTimelineGroup[] {
  const map = new Map<string, AuditEvent[]>();
  for (const e of events) {
    const ist = new Date(new Date(e.at).getTime() + 5.5 * 60 * 60 * 1000);
    const day = ist.toISOString().slice(0, 10);
    const arr = map.get(day) ?? [];
    arr.push(e);
    map.set(day, arr);
  }
  const groups: AuditTimelineGroup[] = [];
  for (const [date, evs] of map) {
    const d = new Date(date + "T00:00:00Z");
    const label = d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      timeZone: "Asia/Kolkata",
    });
    groups.push({ date, label, events: evs });
  }
  return groups.sort((a, b) => (a.date < b.date ? 1 : -1));
}

function isSystem(actor: string) {
  return actor === "system" || actor.includes("@");
}

export function AuditTimeline() {
  const { data, isLoading, isError, error, refetch } = useAudit(50);
  const groups = data ? groupByDay(data) : [];

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ScrollText className="size-4 text-chart-3" aria-hidden />
            <CardTitle>Audit Timeline</CardTitle>
          </div>
          {data && data.length > 0 && (
            <Badge variant="outline" className="gap-1 text-[10px]">
              <Lock className="size-3" aria-hidden />
              sealed
            </Badge>
          )}
        </div>
        <CardDescription>
          Append-only compliance evidence log. Every escalation, stop-rule
          trigger, and batch lifecycle event is recorded here.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isError ? (
          <QueryError message={error?.message} onRetry={() => refetch()} />
        ) : isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-md" />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-10 text-center">
            <ScrollText className="size-6 text-muted-foreground" aria-hidden />
            <p className="text-sm font-medium">No audit events</p>
            <p className="max-w-xs text-xs text-muted-foreground">
              Compliance events will appear here as they occur.
            </p>
          </div>
        ) : (
          <ol
            className="relative max-h-96 space-y-4 overflow-y-auto pr-2 scroll-thin"
            aria-label="Audit timeline"
          >
            {groups.map((g, gi) => (
              <li key={g.date}>
                {/* Date header */}
                <div className="sticky top-0 z-10 mb-2 flex items-center gap-2 bg-background/95 py-1 backdrop-blur">
                  <span className="rounded-full border bg-muted/60 px-2 py-0.5 text-[10px] font-medium tabular-nums">
                    {g.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {g.events.length} event{g.events.length !== 1 ? "s" : ""}
                  </span>
                  <div className="ml-auto h-px flex-1 bg-border/60" />
                </div>
                {/* Events for this day */}
                <ul className="relative space-y-1.5 border-l pl-4">
                  {g.events.map((e, i) => {
                    const meta = getMeta(e.action);
                    const Icon = meta.icon;
                    const sys = isSystem(e.actor);
                    return (
                      <motion.li
                        key={e.id}
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          duration: 0.2,
                          delay: Math.min((gi * 3 + i) * 0.03, 0.5),
                        }}
                        className="relative"
                      >
                        <span
                          className={`absolute -left-[18px] top-2 size-2.5 rounded-full ring-2 ring-background ${meta.dot}`}
                          aria-hidden
                        />
                        <div className="flex items-start gap-2 rounded-md border bg-card/40 px-2.5 py-2 transition-colors hover:bg-accent/40">
                          <Icon
                            className={`mt-0.5 size-3.5 shrink-0 ${meta.tone}`}
                            aria-hidden
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-medium">
                                {meta.label}
                              </span>
                              <span className="ml-auto text-[10px] tabular-nums text-muted-foreground">
                                {formatDateTime(e.at)}
                              </span>
                            </div>
                            {e.detail && (
                              <p className="mt-0.5 text-[11px] text-muted-foreground">
                                {e.detail}
                              </p>
                            )}
                            <div className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                              {sys ? (
                                <Cpu className="size-2.5" aria-hidden />
                              ) : (
                                <User className="size-2.5" aria-hidden />
                              )}
                              <span className="font-mono">{e.actor}</span>
                            </div>
                          </div>
                        </div>
                      </motion.li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
