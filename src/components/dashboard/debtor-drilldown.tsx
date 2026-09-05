"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Search,
  Ban,
  ShieldCheck,
  ShieldOff,
  ArrowUpRight,
  Phone,
  MessageSquare,
  Mail,
  Clock,
  History,
  ScrollText,
  Wallet,
  Plus,
  AlertTriangle,
  Download,
  type LucideIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { QueryError } from "./query-error";
import {
  useDebtors,
  useDebtorDetail,
  useRecordAttempt,
  useManualOptOut,
} from "./queries";
import { toast } from "sonner";
import { formatINR, formatDateTime } from "@/lib/format";
import type {
  DebtorListItem,
  DebtorDetail,
  DebtorAttempt,
} from "@/lib/dashboard-types";

const CHANNEL_ICON: Record<string, LucideIcon> = {
  VOICE: Phone,
  SMS: MessageSquare,
  WHATSAPP: MessageSquare,
  EMAIL: Mail,
};

const OUTCOME_TONE: Record<string, string> = {
  PAID: "border-emerald-300/50 bg-emerald-100/70 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
  PROMISE_TO_PAY:
    "border-amber-300/50 bg-amber-100/70 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
  CONTACTED: "border-border bg-muted text-foreground",
  NO_ANSWER: "border-border bg-muted/60 text-muted-foreground",
  REFUSED: "border-rose-300/50 bg-rose-100/70 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300",
  STOP_REQUESTED:
    "border-rose-400/60 bg-rose-100/80 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300",
  PENDING: "border-border bg-muted/40 text-muted-foreground",
};

function recoveryPctTone(pct: number): string {
  if (pct >= 60) return "text-emerald-600 dark:text-emerald-400";
  if (pct >= 30) return "text-amber-600 dark:text-amber-400";
  return "text-muted-foreground";
}

function DebtorRow({
  d,
  onOpen,
  index,
}: {
  d: DebtorListItem;
  onOpen: (token: string) => void;
  index: number;
}) {
  const Icon = d.optOut ? ShieldOff : ShieldCheck;
  const iconTone = d.optOut
    ? "text-rose-600 dark:text-rose-400"
    : "text-emerald-600 dark:text-emerald-400";
  const recoveryPct = d.outstandingAmount > 0
    ? Math.round((d.recoveredAmount / d.outstandingAmount) * 100)
    : 0;
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.025, 0.4) }}
      onClick={() => onOpen(d.token)}
      className="flex w-full items-center gap-3 rounded-lg border border-border/60 bg-card/40 p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:bg-card/80 hover:shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={`Open detail for ${d.token}`}
    >
      <Icon className={`size-4 shrink-0 ${iconTone}`} aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-medium">{d.token}</span>
          {d.isHoldout && (
            <Badge variant="outline" className="text-[10px]">
              holdout
            </Badge>
          )}
          {d.optOut && (
            <Badge
              variant="outline"
              className="text-[10px] border-rose-300/50 bg-rose-100/70 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
            >
              opted-out
            </Badge>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
          <span>{d.region}</span>
          <span>·</span>
          <span className="uppercase">{d.preferredLanguage}</span>
          <span>·</span>
          <span>Rung {d.currentLevel}</span>
        </div>
      </div>
      <div className="hidden text-right sm:block">
        <div className="text-xs font-medium tabular-nums">
          {formatINR(d.recoveredAmount, { compact: true })}
        </div>
        <div className={`text-[11px] tabular-nums ${recoveryPctTone(recoveryPct)}`}>
          {recoveryPct}% recovered
        </div>
      </div>
      <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
    </motion.button>
  );
}

function AttemptItem({ a }: { a: DebtorAttempt }) {
  const Icon = CHANNEL_ICON[a.channel] ?? Phone;
  const tone = OUTCOME_TONE[a.outcome] ?? OUTCOME_TONE.PENDING;
  return (
    <li className="flex items-start gap-3 rounded-lg border bg-card/40 p-2.5">
      <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-md bg-muted">
        <Icon className="size-3.5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" className={`text-[10px] ${tone}`}>
            {a.outcome.replace(/_/g, " ")}
          </Badge>
          <span className="text-[11px] text-muted-foreground">
            {a.channel} · Rung {a.escalationLevel}
          </span>
          <span className="ml-auto text-[11px] tabular-nums text-muted-foreground">
            {formatDateTime(a.attemptedAt)}
          </span>
        </div>
        {a.amountCollected > 0 && (
          <div className="mt-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 tabular-nums">
            +{formatINR(a.amountCollected)} collected
          </div>
        )}
        {a.transcriptSnippet && (
          <p className="mt-1 truncate rounded bg-muted/60 px-2 py-1 text-[11px] italic text-muted-foreground">
            &ldquo;{a.transcriptSnippet}&rdquo;
          </p>
        )}
      </div>
    </li>
  );
}

function DetailSheet({
  token,
  open,
  onOpenChange,
}: {
  token?: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { data, isLoading, isError, error, refetch } = useDebtorDetail(
    open ? token : undefined,
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
      >
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle className="flex items-center gap-2">
            <Users className="size-4 text-muted-foreground" aria-hidden />
            Debtor drill-down
          </SheetTitle>
          <SheetDescription className="flex items-center gap-2 font-mono text-xs">
            <span>{token ?? "—"}</span>
            {token && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 gap-1 px-2 text-[11px]"
                onClick={async () => {
                  try {
                    const res = await fetch(
                      `/api/debtors/${encodeURIComponent(token)}/export`,
                    );
                    if (!res.ok) throw new Error("Export failed");
                    const blob = await res.blob();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download =
                      res.headers
                        .get("Content-Disposition")
                        ?.match(/filename="([^"]+)"/)?.[1] ??
                      `debtor-${token}.csv`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    toast.success("Debtor CSV exported", {
                      description: `${token} compliance record downloaded.`,
                    });
                  } catch (e) {
                    toast.error("Export failed", {
                      description: (e as Error).message,
                    });
                  }
                }}
                aria-label={`Export ${token} compliance record as CSV`}
              >
                <Download className="size-3" aria-hidden />
                CSV
              </Button>
            )}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto scroll-thin">
          {isError ? (
            <div className="p-5">
              <QueryError message={error?.message} onRetry={() => refetch()} />
            </div>
          ) : isLoading || !data ? (
            <div className="space-y-3 p-5">
              <Skeleton className="h-20 w-full rounded-lg" />
              <Skeleton className="h-40 w-full rounded-lg" />
              <Skeleton className="h-40 w-full rounded-lg" />
            </div>
          ) : (
            <DetailBody data={data} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function DebtorActions({
  token,
  currentLevel,
}: {
  token: string;
  currentLevel: number;
}) {
  const [showForm, setShowForm] = React.useState(false);
  const [outcome, setOutcome] = React.useState("CONTACTED");
  const [channel, setChannel] = React.useState("VOICE");
  const [amount, setAmount] = React.useState("");
  const [snippet, setSnippet] = React.useState("");
  const recordAttempt = useRecordAttempt();
  const manualOptOut = useManualOptOut();

  function handleSubmitAttempt(e: React.FormEvent) {
    e.preventDefault();
    recordAttempt.mutate(
      {
        token,
        channel,
        escalationLevel: currentLevel,
        outcome,
        amountCollected: amount ? Number(amount) : undefined,
        transcriptSnippet: snippet || undefined,
      },
      {
        onSuccess: (res) => {
          toast.success("Attempt recorded", {
            description: `${res.attempt.channel} · ${res.attempt.outcome}${
              res.attempt.amountCollected > 0
                ? ` · ₹${res.attempt.amountCollected}`
                : ""
            }`,
          });
          setShowForm(false);
          setAmount("");
          setSnippet("");
        },
        onError: (err: Error) =>
          toast.error("Record failed", { description: err.message }),
      },
    );
  }

  function handleOptOut() {
    manualOptOut.mutate(
      { token, reason: "MANUAL_OPERATOR_OPTOUT", language: "en" },
      {
        onSuccess: () =>
          toast.success("Debtor opted-out", {
            description: `${token} suppressed from all outreach.`,
          }),
        onError: (err: Error) =>
          toast.error("Opt-out failed", { description: err.message }),
      },
    );
  }

  const OUTCOMES = [
    "CONTACTED",
    "PROMISE_TO_PAY",
    "PAID",
    "NO_ANSWER",
    "REFUSED",
  ];

  return (
    <div className="rounded-xl border bg-muted/20 p-3">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Operator actions
        </span>
        <div className="ml-auto flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1.5 text-xs"
            onClick={() => setShowForm((v) => !v)}
            aria-expanded={showForm}
            aria-label="Record attempt"
          >
            <Plus className="size-3" aria-hidden />
            Record attempt
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="h-7 gap-1.5 border-rose-300/50 text-rose-600 text-xs hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                disabled={manualOptOut.isPending}
                aria-label="Manually opt-out debtor"
              >
                <Ban className="size-3" aria-hidden />
                Opt-out
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle
                    className="size-4 text-rose-600 dark:text-rose-400"
                    aria-hidden
                  />
                  Manually opt-out {token}?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently halts all outreach for this debtor and
                  writes an immutable OptOutRecord + audit event. This action
                  cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleOptOut}
                  className="bg-rose-600 text-white hover:bg-rose-600/90"
                >
                  Confirm opt-out
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleSubmitAttempt}
            className="overflow-hidden"
          >
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-muted-foreground">
                  Channel
                </label>
                <Select value={channel} onValueChange={setChannel}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VOICE">Voice</SelectItem>
                    <SelectItem value="SMS">SMS</SelectItem>
                    <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                    <SelectItem value="EMAIL">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-muted-foreground">
                  Outcome
                </label>
                <Select value={outcome} onValueChange={setOutcome}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OUTCOMES.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-muted-foreground">
                  Amount collected (₹)
                </label>
                <Input
                  type="number"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="h-8 text-xs tabular-nums"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-muted-foreground">
                  Transcript snippet
                </label>
                <Input
                  value={snippet}
                  onChange={(e) => setSnippet(e.target.value)}
                  placeholder="optional"
                  className="h-8 text-xs"
                />
              </div>
            </div>
            <div className="mt-2 flex justify-end gap-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={recordAttempt.isPending}
                className="h-7 gap-1.5 bg-emerald-600 text-xs text-white hover:bg-emerald-600/90"
              >
                {recordAttempt.isPending ? "Recording…" : "Save attempt"}
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

function DetailBody({ data }: { data: DebtorDetail }) {
  const recoveryPct = data.recoveryPct;
  return (
    <div className="space-y-4 p-5">
      {/* Header card */}
      <div className="rounded-xl border bg-card/60 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm font-semibold">{data.token}</span>
          {data.isHoldout && (
            <Badge variant="outline" className="text-[10px]">
              holdout
            </Badge>
          )}
          <Badge
            variant="outline"
            className={
              data.optOut
                ? "text-[10px] border-rose-300/50 bg-rose-100/70 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                : "text-[10px] border-emerald-300/50 bg-emerald-100/70 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
            }
          >
            {data.optOut ? "opted-out" : "active"}
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            Rung {data.currentLevel}
          </Badge>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {data.batchName} · {data.region} · {data.preferredLanguage.toUpperCase()}
        </p>

        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <div className="text-[10px] uppercase text-muted-foreground">
              Outstanding
            </div>
            <div className="text-sm font-semibold tabular-nums">
              {formatINR(data.outstandingAmount, { compact: true })}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-muted-foreground">
              Recovered
            </div>
            <div className="text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
              {formatINR(data.recoveredAmount, { compact: true })}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-muted-foreground">
              Recovery %
            </div>
            <div className={`text-sm font-semibold tabular-nums ${recoveryPctTone(recoveryPct)}`}>
              {recoveryPct}%
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-muted-foreground">
              Attempts
            </div>
            <div className="text-sm font-semibold tabular-nums">
              {data.attemptCountTotal}
            </div>
          </div>
        </div>

        {data.optOut && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-rose-300/40 bg-rose-50 p-2.5 text-xs dark:bg-rose-950/30">
            <Ban className="mt-0.5 size-3.5 shrink-0 text-rose-600 dark:text-rose-400" aria-hidden />
            <div>
              <span className="font-medium text-rose-700 dark:text-rose-300">
                Outreach halted.
              </span>{" "}
              <span className="text-muted-foreground">
                Reason: {data.optOutReason ?? "unknown"}
                {data.stoppedReason ? ` · rule ${data.stoppedReason}` : ""}.
              </span>
            </div>
          </div>
        )}

        {data.lastAttemptAt && (
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Clock className="size-3" aria-hidden />
            Last attempt {formatDateTime(data.lastAttemptAt)}
          </div>
        )}
      </div>

      {/* Write actions: record attempt + manual opt-out */}
      {!data.optOut && (
        <DebtorActions token={data.token} currentLevel={data.currentLevel} />
      )}

      {/* Tabs: attempts / opt-outs / audit */}
      <Tabs defaultValue="attempts">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="attempts" className="gap-1 text-xs">
            <Phone className="size-3" aria-hidden />
            Attempts
            <span className="ml-1 rounded bg-muted px-1 text-[10px] tabular-nums">
              {data.attempts.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="optouts" className="gap-1 text-xs">
            <Ban className="size-3" aria-hidden />
            Opt-outs
            <span className="ml-1 rounded bg-muted px-1 text-[10px] tabular-nums">
              {data.optOuts.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-1 text-xs">
            <ScrollText className="size-3" aria-hidden />
            Audit
            <span className="ml-1 rounded bg-muted px-1 text-[10px] tabular-nums">
              {data.audit.length}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="attempts" className="mt-3">
          {data.attempts.length === 0 ? (
            <EmptyState
              icon={Phone}
              title="No attempts recorded"
              hint="Outreach has not yet been attempted for this debtor."
            />
          ) : (
            <ul className="space-y-2">
              {data.attempts.map((a) => (
                <AttemptItem key={a.id} a={a} />
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="optouts" className="mt-3">
          {data.optOuts.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="No opt-out records"
              hint="This debtor has not requested to stop outreach."
            />
          ) : (
            <ul className="space-y-2">
              {data.optOuts.map((o) => (
                <li
                  key={o.id}
                  className="rounded-lg border bg-card/40 p-2.5 text-xs"
                >
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge
                      variant="outline"
                      className="text-[10px] border-rose-300/50 bg-rose-100/70 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                    >
                      {o.language.toUpperCase()}
                    </Badge>
                    <span className="font-medium">{o.reason}</span>
                    <span className="ml-auto tabular-nums text-muted-foreground">
                      {formatDateTime(o.detectedAt)}
                    </span>
                  </div>
                  {o.rawPhrase && (
                    <p className="mt-1.5 rounded bg-muted/60 px-2 py-1 italic text-muted-foreground">
                      &ldquo;{o.rawPhrase}&rdquo;
                    </p>
                  )}
                  <div className="mt-1 text-[10px] text-muted-foreground">
                    source: {o.source}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="audit" className="mt-3">
          {data.audit.length === 0 ? (
            <EmptyState
              icon={ScrollText}
              title="No audit events"
              hint="No compliance events recorded for this debtor yet."
            />
          ) : (
            <ol className="relative space-y-2 border-l pl-4">
              {data.audit.map((e) => (
                <li key={e.id} className="relative">
                  <span className="absolute -left-[18px] top-1.5 size-2 rounded-full bg-foreground/50" aria-hidden />
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">{e.action}</span>
                    <span className="ml-auto text-[10px] tabular-nums text-muted-foreground">
                      {formatDateTime(e.at)}
                    </span>
                  </div>
                  {e.detail && (
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {e.detail}
                    </p>
                  )}
                  <div className="text-[10px] text-muted-foreground">
                    actor: {e.actor}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  hint,
}: {
  icon: LucideIcon;
  title: string;
  hint: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-10 text-center">
      <Icon className="size-6 text-muted-foreground" aria-hidden />
      <p className="text-sm font-medium">{title}</p>
      <p className="max-w-xs text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

export function DebtorDrilldown({ batchId }: { batchId?: string }) {
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const [open, setOpen] = React.useState(false);
  const [selectedToken, setSelectedToken] = React.useState<string | undefined>();

  // Debounce search
  const [debouncedQ, setDebouncedQ] = React.useState("");
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  const { data, isLoading, isError, error, refetch } = useDebtors(batchId, {
    q: debouncedQ,
    status,
    limit: 60,
  });

  function openToken(token: string) {
    setSelectedToken(token);
    setOpen(true);
  }

  const statusFilters: { key: string; label: string }[] = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "optout", label: "Opted-out" },
    { key: "treated", label: "Treated" },
    { key: "holdout", label: "Holdout" },
  ];

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-chart-4" aria-hidden />
            <CardTitle>Debtor Registry</CardTitle>
          </div>
          {data && (
            <Badge variant="outline" className="text-[10px]">
              {data.length} shown
            </Badge>
          )}
        </div>
        <CardDescription>
          Search and inspect any debtor. Click a row to open the full
          drill-down — attempts timeline, opt-out history, and the audit trail.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search token or region…"
              aria-label="Search debtors"
              className="pl-8"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {statusFilters.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setStatus(f.key)}
                className={`rounded-full border px-3 py-1 text-xs transition-all duration-150 active:scale-95 ${
                  status === f.key
                    ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold shadow-xs"
                    : "border-border/60 bg-background/80 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
                aria-pressed={status === f.key}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <Separator />

        {isError ? (
          <QueryError message={error?.message} onRetry={() => refetch()} />
        ) : isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : data && data.length > 0 ? (
          <ul
            className="max-h-80 space-y-1.5 overflow-y-auto pr-1 scroll-thin"
            aria-label="Debtor list"
          >
            {data.map((d, i) => (
              <DebtorRow key={d.id} d={d} onOpen={openToken} index={i} />
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-10 text-center">
            <Wallet className="size-6 text-muted-foreground" aria-hidden />
            <p className="text-sm font-medium">No debtors match</p>
            <p className="max-w-xs text-xs text-muted-foreground">
              Try a different search term or status filter.
            </p>
          </div>
        )}
      </CardContent>

      <DetailSheet
        token={selectedToken}
        open={open}
        onOpenChange={setOpen}
      />
    </Card>
  );
}
