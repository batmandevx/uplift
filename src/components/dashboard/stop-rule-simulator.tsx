"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PhoneOff,
  Send,
  Languages,
  ShieldAlert,
  CheckCircle2,
  ChevronDown,
  Sparkles,
  Brain,
  XCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSubmitStopRule, useLLMClassify } from "./queries";
import { toast } from "sonner";
import type {
  DetectedLanguage,
  StopRuleResponse,
  LLMClassifyResponse,
} from "@/lib/dashboard-types";

const SAMPLE_PHRASES: { phrase: string; lang: DetectedLanguage; note: string }[] = [
  { phrase: "stop calling me", lang: "en", note: "English explicit" },
  { phrase: "please stop", lang: "en", note: "English short" },
  { phrase: "mujhe call mat karo", lang: "hinglish", note: "Hinglish — first-class" },
  { phrase: "calls band karo", lang: "hinglish", note: "Hinglish — first-class" },
  { phrase: "ab phone mat karna", lang: "hinglish", note: "Hinglish — first-class" },
  { phrase: "chhodo mujhe", lang: "hinglish", note: "Hinglish — first-class" },
  { phrase: "मुझे कॉल मत करो", lang: "hi", note: "Devanagari Hindi" },
  { phrase: "yaar please leave me alone na", lang: "hinglish", note: "Fuzzy — LLM only" },
  { phrase: "bahut ho gaya ab, bas karo", lang: "hinglish", note: "Fuzzy — LLM only" },
];

const LANG_BADGE: Record<DetectedLanguage, string> = {
  en: "border-border bg-muted text-foreground",
  hi: "border-rose-300/50 bg-rose-100/70 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300",
  hinglish:
    "border-emerald-300/50 bg-emerald-100/70 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
};

function HaltedCard({ event }: { event: StopRuleResponse["event"] }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="rounded-lg border border-emerald-300/50 bg-emerald-50 p-3 dark:bg-emerald-950/40"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2">
        <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden />
        <span className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
          Outreach halted
        </span>
        <Badge
          variant="outline"
          className={`ml-auto ${LANG_BADGE[event.detectedLanguage]}`}
        >
          {event.detectedLanguage.toUpperCase()}
        </Badge>
      </div>
      <div className="mt-2 grid grid-cols-1 gap-1.5 text-xs sm:grid-cols-2">
        <div>
          <span className="text-muted-foreground">Debtor: </span>
          <span className="font-mono">{event.debtorToken}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Matched rule: </span>
          <span className="font-medium">{event.matchedRule}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Action: </span>
          <span className="font-medium">{event.actionTaken}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Confidence: </span>
          <span className="font-medium tabular-nums">
            {Math.round(event.confidence * 100)}%
          </span>
        </div>
      </div>
      <div className="mt-2 truncate rounded bg-background/70 px-2 py-1 text-xs text-muted-foreground">
        &ldquo;{event.rawPhrase}&rdquo;
      </div>
    </motion.div>
  );
}

function ClassifyPanel({ result }: { result: LLMClassifyResponse }) {
  const isStop = result.isStopRequest;
  const Icon = isStop ? CheckCircle2 : XCircle;
  const tone = isStop
    ? "border-emerald-300/50 bg-emerald-50/70 dark:bg-emerald-950/30"
    : "border-border bg-muted/40";
  const iconTone = isStop
    ? "text-emerald-600 dark:text-emerald-400"
    : "text-muted-foreground";
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`rounded-lg border p-3 ${tone}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2">
        <Icon className={`size-4 ${iconTone}`} aria-hidden />
        <span className="text-sm font-medium">
          {isStop ? "Stop intent detected" : "Not a stop request"}
        </span>
        <Badge
          variant="outline"
          className={`ml-auto ${LANG_BADGE[result.language]}`}
        >
          {result.language.toUpperCase()}
        </Badge>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1.5 text-xs sm:grid-cols-3">
        <div>
          <span className="text-muted-foreground">Intent: </span>
          <span className="font-medium">{result.intent}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Confidence: </span>
          <span className="font-medium tabular-nums">
            {Math.round(result.confidence * 100)}%
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Rule: </span>
          <span className="font-medium font-mono text-[11px]">
            {result.rule}
          </span>
        </div>
      </div>
      <p className="mt-2 text-xs italic text-muted-foreground">
        {result.reasoning}
      </p>
      <div className="mt-1.5 text-[10px] text-muted-foreground">
        Matched by{" "}
        <span className="font-mono">
          {result.matchedBy === "llm"
            ? "LLM fuzzy classifier"
            : result.matchedBy === "phrase-list"
              ? "phrase-list"
              : "none"}
        </span>
      </div>
    </motion.div>
  );
}

export function StopRuleSimulator() {
  const [phrase, setPhrase] = React.useState("");
  const [debtorToken, setDebtorToken] = React.useState("");
  const [lastEvent, setLastEvent] = React.useState<
    StopRuleResponse["event"] | null
  >(null);
  const [classifyResult, setClassifyResult] =
    React.useState<LLMClassifyResponse | null>(null);
  const submit = useSubmitStopRule();
  const classify = useLLMClassify();
  const phraseInputRef = React.useRef<HTMLInputElement>(null);

  // Global keyboard shortcut: press "S" (when not already typing in an
  // input/textarea) to focus the stop-phrase input for fast demoing.
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const isEditable =
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        target?.isContentEditable;
      if (isEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        phraseInputRef.current?.focus();
        phraseInputRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!phrase.trim()) {
      toast.error("Enter a phrase to test");
      return;
    }
    submit.mutate(
      { phrase: phrase.trim(), debtorToken: debtorToken || undefined },
      {
        onSuccess: (res) => {
          setLastEvent(res.event);
          const lang = res.event.detectedLanguage;
          toast.success("Outreach halted", {
            description:
              lang === "hinglish"
                ? `Hinglish stop-rule matched: ${res.event.matchedRule}`
                : `${lang.toUpperCase()} stop-rule matched`,
          });
          setPhrase("");
          setClassifyResult(null);
        },
        onError: (err: Error) =>
          toast.error("Stop-rule failed", { description: err.message }),
      }
    );
  }

  function handleClassify() {
    if (!phrase.trim()) {
      toast.error("Enter a phrase to classify");
      return;
    }
    classify.mutate(
      { phrase: phrase.trim() },
      {
        onSuccess: (res) => {
          setClassifyResult(res);
          if (res.isStopRequest) {
            toast.success("Stop intent detected", {
              description: `${res.language.toUpperCase()} · ${res.rule} · ${Math.round(
                res.confidence * 100,
              )}%`,
            });
          } else {
            toast.info("Not a stop request", {
              description: `Intent: ${res.intent}`,
            });
          }
        },
        onError: (err: Error) =>
          toast.error("Classification failed", { description: err.message }),
      },
    );
  }

  function pickSample(s: { phrase: string; lang: DetectedLanguage }) {
    setPhrase(s.phrase);
    setClassifyResult(null);
    toast.info(`Loaded sample (${s.lang.toUpperCase()})`, {
      description: `"${s.phrase}"`,
    });
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <PhoneOff className="size-4 text-rose-600 dark:text-rose-400" aria-hidden />
            <CardTitle>Stop-Rule Simulator</CardTitle>
          </div>
          <Badge
            variant="outline"
            className="gap-1 border-emerald-300/50 bg-emerald-100/70 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
          >
            <Languages className="size-3" aria-hidden /> en · hi · Hinglish
          </Badge>
        </div>
        <CardDescription>
          Type a stop phrase in English, Hindi (Devanagari), or Hinglish
          (Romanized). Hinglish is a first-class supported language. Use{" "}
          <strong>AI Classify</strong> to test fuzzy/colloquial phrases via the
          LLM before halting outreach.
          <span className="ml-1 inline-flex items-center gap-0.5 rounded border bg-muted/60 px-1 py-px text-[9px] font-mono align-middle">
            S
          </span>{" "}
          to focus.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              value={debtorToken}
              onChange={(e) => setDebtorToken(e.target.value)}
              placeholder="Auto-select debtor"
              aria-label="Debtor token (optional)"
              className="sm:w-44 font-mono text-xs"
            />
            <div className="relative flex flex-1 items-center">
              <Input
                ref={phraseInputRef}
                value={phrase}
                onChange={(e) => {
                  setPhrase(e.target.value);
                  setClassifyResult(null);
                }}
                placeholder='e.g. "mujhe call mat karo"'
                aria-label="Stop phrase"
                className="pr-28"
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 gap-1 px-2 text-xs"
                    aria-label="Pick a sample phrase"
                  >
                    Samples
                    <ChevronDown className="size-3" aria-hidden />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel className="text-xs">
                    Sample phrases
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {SAMPLE_PHRASES.map((s) => (
                    <DropdownMenuItem
                      key={s.phrase}
                      onSelect={() => pickSample(s)}
                      className="flex-col items-start gap-0.5 py-2"
                    >
                      <div className="flex w-full items-center gap-2">
                        <span className="truncate text-sm">{s.phrase}</span>
                        <Badge
                          variant="outline"
                          className={`ml-auto text-[10px] ${LANG_BADGE[s.lang]}`}
                        >
                          {s.lang.toUpperCase()}
                        </Badge>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {s.note}
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClassify}
                disabled={classify.isPending || !phrase.trim()}
                className="gap-1.5 border-violet-500/30 bg-violet-500/10 font-medium text-violet-600 hover:bg-violet-500/20 dark:text-violet-300 dark:hover:bg-violet-500/20 active:scale-98 transition-all"
                aria-label="AI classify the phrase"
              >
                {classify.isPending ? (
                  <Sparkles className="size-4 animate-spin text-violet-500" aria-hidden />
                ) : (
                  <Brain className="size-4" aria-hidden />
                )}
                <span className="hidden sm:inline">AI Classify</span>
                <span className="sm:hidden">AI</span>
              </Button>
              <Button
                type="submit"
                disabled={submit.isPending}
                className="gap-1.5 bg-rose-600 font-medium text-white shadow-xs hover:bg-rose-500 active:scale-98 sm:w-auto transition-all"
              >
                {submit.isPending ? (
                  <ShieldAlert className="size-4 animate-pulse" aria-hidden />
                ) : (
                  <Send className="size-4" aria-hidden />
                )}
                Halt outreach
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mr-1">Quick test:</span>
            {SAMPLE_PHRASES.slice(0, 7).map((s) => (
              <button
                key={s.phrase}
                type="button"
                onClick={() => pickSample(s)}
                className="rounded-full border border-border/60 bg-background/80 px-2.5 py-1 text-xs text-muted-foreground transition-all duration-150 hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-foreground active:scale-95"
              >
                {s.phrase}
              </button>
            ))}
          </div>
        </form>

        <AnimatePresence mode="wait">
          {classifyResult && (
            <ClassifyPanel result={classifyResult} key="classify" />
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {lastEvent && <HaltedCard event={lastEvent} key={lastEvent.id} />}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
