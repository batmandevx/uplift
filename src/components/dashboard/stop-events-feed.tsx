"use client";

import { motion } from "framer-motion";
import {
  Activity,
  Languages,
  Clock,
  MessageSquareQuote,
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
import { useStopEvents } from "./queries";
import { formatDateTime } from "@/lib/format";
import type { DetectedLanguage } from "@/lib/dashboard-types";

const LANG_BADGE: Record<DetectedLanguage, string> = {
  en: "border-border bg-muted text-foreground",
  hi: "border-rose-300/50 bg-rose-100/70 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300",
  hinglish:
    "border-emerald-300/50 bg-emerald-100/70 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
};

function Confidence({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const tone =
    pct >= 85
      ? "text-emerald-600 dark:text-emerald-400"
      : pct >= 60
        ? "text-amber-600 dark:text-amber-400"
        : "text-rose-600 dark:text-rose-400";
  return (
    <span className={`font-medium tabular-nums ${tone}`}>{pct}%</span>
  );
}

export function StopEventsFeed() {
  const { data, isLoading, isError, error, refetch } = useStopEvents(20);
  const events = data ?? [];

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-chart-5" aria-hidden />
            <CardTitle>Recent Stop-Rule Events</CardTitle>
          </div>
          {events.length > 0 && (
            <Badge variant="outline" className="gap-1">
              last {events.length}
            </Badge>
          )}
        </div>
        <CardDescription>
          Live feed of detected stop phrases. Hinglish rows are highlighted as a
          first-class supported language.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isError ? (
          <QueryError message={error?.message} onRetry={() => refetch()} />
        ) : isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-md" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-10 text-center">
            <Languages className="size-6 text-muted-foreground" aria-hidden />
            <p className="text-sm font-medium">No stop events yet</p>
            <p className="max-w-xs text-xs text-muted-foreground">
              Use the simulator above to trigger a stop-rule. Detected phrases
              will appear here.
            </p>
          </div>
        ) : (
          <ul
            className="max-h-96 space-y-2 overflow-y-auto pr-1 scroll-thin"
            aria-label="Recent stop rule events"
          >
            {events.map((e, i) => {
              const isHinglish = e.detectedLanguage === "hinglish";
              return (
                <motion.li
                  key={e.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: Math.min(i, 6) * 0.04 }}
                  className={`rounded-lg border p-3 ${
                    isHinglish
                      ? "border-emerald-300/50 bg-emerald-50/60 dark:bg-emerald-950/30"
                      : "bg-card/60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <MessageSquareQuote
                        className={`size-4 shrink-0 ${
                          isHinglish
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-muted-foreground"
                        }`}
                        aria-hidden
                      />
                      <p className="truncate text-sm font-medium">
                        &ldquo;{e.rawPhrase}&rdquo;
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`shrink-0 ${LANG_BADGE[e.detectedLanguage]}`}
                    >
                      {e.detectedLanguage.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="mt-2 grid grid-cols-1 gap-1 text-[11px] text-muted-foreground sm:grid-cols-2">
                    <div>
                      <span>Rule: </span>
                      <span className="font-medium text-foreground">
                        {e.matchedRule}
                      </span>
                    </div>
                    <div>
                      <span>Action: </span>
                      <span className="font-medium text-foreground">
                        {e.actionTaken}
                      </span>
                    </div>
                    <div>
                      <span>Confidence: </span>
                      <Confidence value={e.confidence} />
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="size-3" aria-hidden />
                      <span>{formatDateTime(e.at)}</span>
                    </div>
                  </div>
                  <div className="mt-1 text-[10px] font-mono text-muted-foreground">
                    {e.debtorToken}
                  </div>
                </motion.li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
