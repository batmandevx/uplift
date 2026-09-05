"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Mic,
  Volume2,
  CheckCircle2,
  Languages,
  ShieldCheck,
  Play,
  RotateCcw,
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

export function VoiceMoatCard() {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [confirmed, setConfirmed] = React.useState(true);

  function playDigitConfirmationDemo() {
    setIsPlaying(true);
    toast.info("Playing Sarvam Hinglish Voice Moat demo...", {
      description: "Mandatory repeat-back digit verification for promise-to-pay.",
    });
    setTimeout(() => {
      setIsPlaying(false);
      setConfirmed(true);
      toast.success("Digit Verification Confirmed", {
        description: "5-0-0-0 validated. Promise-to-pay safely captured.",
      });
    }, 2400);
  }

  return (
    <Card className="h-full border-teal-500/25 shadow-xl overflow-hidden relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-teal-500 via-emerald-400 to-cyan-400" />

      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-teal-500/20 to-emerald-500/10 text-teal-400 border border-teal-500/30">
              <Mic className="size-4" />
            </span>
            <div>
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <span>Voice Moat: Latency & Precision</span>
                <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-400 text-[10px]">
                  &lt; 1.5s E2E
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Sarvam ASR (Hinglish) → Guardrailed LLM → Streaming TTS
              </CardDescription>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={playDigitConfirmationDemo}
            disabled={isPlaying}
            className="h-8 gap-1.5 text-xs font-semibold border-teal-500/30 text-teal-400 hover:bg-teal-500/10 active:scale-98"
          >
            <Play className={`size-3.5 ${isPlaying ? "animate-spin text-teal-300" : ""}`} />
            <span>{isPlaying ? "Verifying..." : "Play Voice Demo"}</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3.5">
        {/* Mandatory Repeat-Back Digit Confirmation Box */}
        <div className="rounded-xl border border-teal-500/30 bg-teal-950/20 p-3.5 text-xs">
          <div className="flex items-center justify-between gap-2 border-b border-teal-500/20 pb-2 mb-2.5">
            <span className="font-bold text-teal-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-teal-400" />
              <span>Mandatory Repeat-Back Digit Confirmation</span>
            </span>
            <Badge variant="outline" className="border-teal-500/40 text-[10px] text-teal-400">
              Zero Silent Correction
            </Badge>
          </div>

          <div className="rounded-lg bg-background/60 border border-border/70 p-3">
            <p className="text-sm font-semibold text-foreground leading-relaxed">
              &ldquo;आपने पांच हज़ार कहा — <span className="text-teal-400 font-bold underline decoration-teal-500">पाँच-शून्य-शून्य-शून्य</span>, सही है?&rdquo;
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              (You said five thousand — 5-0-0-0, is that correct?)
            </p>
          </div>

          <div className="mt-2.5 flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="size-3.5" />
              <span>Failed confirmations re-ask immediately</span>
            </span>
            <span className="font-mono text-[10px]">temp = 0.0</span>
          </div>
        </div>

        {/* Latency Pipeline Bar */}
        <div className="rounded-lg border border-border/60 bg-card/40 p-2.5 text-xs">
          <div className="flex items-center justify-between mb-1.5 text-[11px]">
            <span className="text-muted-foreground">Speech-to-Speech Streaming Pipeline</span>
            <span className="font-mono font-semibold text-teal-400">1,280 ms Total</span>
          </div>
          <div className="grid grid-cols-3 gap-1 text-center font-mono text-[10px]">
            <div className="rounded bg-teal-500/15 border border-teal-500/30 p-1 text-teal-300">
              ASR: 420ms
            </div>
            <div className="rounded bg-cyan-500/15 border border-cyan-500/30 p-1 text-cyan-300">
              LLM: 380ms
            </div>
            <div className="rounded bg-emerald-500/15 border border-emerald-500/30 p-1 text-emerald-300">
              TTS: 480ms
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
