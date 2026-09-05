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
import { useSubmitStopRule } from "./queries";
import { toast } from "sonner";
import type { DetectedLanguage, StopRuleResponse } from "@/lib/dashboard-types";

const SAMPLE_PHRASES: { phrase: string; lang: DetectedLanguage; note: string }[] = [
  { phrase: "stop calling me", lang: "en", note: "English explicit" },
  { phrase: "please stop", lang: "en", note: "English short" },
  { phrase: "mujhe call mat karo", lang: "hinglish", note: "Hinglish — first-class" },
  { phrase: "calls band karo", lang: "hinglish", note: "Hinglish — first-class" },
  { phrase: "ab phone mat karna", lang: "hinglish", note: "Hinglish — first-class" },
  { phrase: "chhodo mujhe", lang: "hinglish", note: "Hinglish — first-class" },
  { phrase: "मुझे कॉल मत करो", lang: "hi", note: "Devanagari Hindi" },
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

export function StopRuleSimulator() {
  const [phrase, setPhrase] = React.useState("");
  const [debtorToken, setDebtorToken] = React.useState("DEBT-7F3A9C");
  const [lastEvent, setLastEvent] = React.useState<
    StopRuleResponse["event"] | null
  >(null);
  const submit = useSubmitStopRule();

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
        },
        onError: (err: Error) =>
          toast.error("Stop-rule failed", { description: err.message }),
      }
    );
  }

  function pickSample(s: { phrase: string; lang: DetectedLanguage }) {
    setPhrase(s.phrase);
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
          (Romanized). Hinglish is a first-class supported language. Submitting
          halts outreach and writes an OptOutRecord + StopRuleEvent.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              value={debtorToken}
              onChange={(e) => setDebtorToken(e.target.value)}
              placeholder="Debtor token (optional)"
              aria-label="Debtor token"
              className="sm:w-44 font-mono text-xs"
            />
            <div className="relative flex flex-1 items-center">
              <Input
                value={phrase}
                onChange={(e) => setPhrase(e.target.value)}
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
            <Button
              type="submit"
              disabled={submit.isPending}
              className="gap-1.5 bg-rose-600 text-white hover:bg-rose-600/90 sm:w-auto"
            >
              {submit.isPending ? (
                <ShieldAlert className="size-4 animate-pulse" aria-hidden />
              ) : (
                <Send className="size-4" aria-hidden />
              )}
              Halt outreach
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground">Quick:</span>
            {SAMPLE_PHRASES.slice(0, 6).map((s) => (
              <button
                key={s.phrase}
                type="button"
                onClick={() => pickSample(s)}
                className="rounded-full border bg-background px-2.5 py-0.5 text-[11px] transition-colors hover:bg-accent"
              >
                {s.phrase}
              </button>
            ))}
          </div>
        </form>

        <AnimatePresence mode="wait">
          {lastEvent && <HaltedCard event={lastEvent} key={lastEvent.id} />}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
