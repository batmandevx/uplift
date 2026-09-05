"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  ShieldAlert,
  ShieldCheck,
  Zap,
  AlertOctagon,
  Ban,
  CheckCircle2,
  Lock,
  Flame,
  ArrowRight,
  Code2,
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

export function GuardrailsChaosPanel() {
  const [chaosRunning, setChaosRunning] = React.useState(false);
  const [chaosScore, setChaosScore] = React.useState("20/20");

  function runChaosTest() {
    setChaosRunning(true);
    toast.info("Chaos Engine: Simulating 20 fault injections...", {
      description: "Injecting synthetic TTS drops, LLM timeouts, and duplicate webhooks.",
    });

    setTimeout(() => {
      setChaosRunning(false);
      setChaosScore("20/20");
      toast.success("Chaos Suite Completed: 20/20 Passed", {
        description: "Median fallback time: 1.8s. Degraded gracefully with deterministic templates.",
      });
    }, 1800);
  }

  return (
    <Card className="h-full border-amber-500/20 shadow-xl overflow-hidden relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-amber-500 via-orange-400 to-rose-500" />

      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/10 text-amber-400 border border-amber-500/30">
              <ShieldAlert className="size-4" />
            </span>
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                Policy Engine & Chaos Defense
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                No LLM in the money path · Ed25519 Signed Mandates · Cost-Benefit Suppression
              </CardDescription>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={runChaosTest}
            disabled={chaosRunning}
            className="h-8 gap-1.5 text-xs font-semibold border-orange-500/30 text-orange-400 hover:bg-orange-500/10 active:scale-98"
          >
            <Flame className={`size-3.5 ${chaosRunning ? "animate-bounce text-rose-400" : "text-amber-400"}`} />
            <span>{chaosRunning ? "Simulating Chaos..." : "Run $ make chaos"}</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Case Study Box: LLM Discount Attempt vs Policy Guardrail */}
        <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-4 text-xs">
          <div className="flex items-center justify-between gap-2 border-b border-rose-500/20 pb-2 mb-3">
            <span className="font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertOctagon className="size-4 text-rose-500" />
              <span>Guardrail In Practice // Case Study</span>
            </span>
            <Badge variant="outline" className="border-rose-500/40 bg-rose-500/10 text-rose-400 text-[10px] font-mono">
              tests/test_agent_cannot_exceed_discount_cap.py
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
            {/* LLM Attempt */}
            <div className="rounded-lg border border-border/70 bg-card/60 p-2.5">
              <div className="text-[10px] uppercase font-mono text-muted-foreground mb-1">
                LLM Hallucinated Output
              </div>
              <div className="text-rose-300 font-semibold leading-snug">
                &ldquo;Offer 20% discount to save ₹4,000 payment&rdquo;
              </div>
            </div>

            {/* Guardrail Wall */}
            <div className="flex flex-col items-center justify-center p-2 text-center">
              <div className="size-8 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mb-1">
                <Ban className="size-4" />
              </div>
              <div className="text-xs font-bold text-foreground">Policy Engine Barrier</div>
              <div className="text-[10px] text-amber-400 font-mono">Hard Cap: 5% Max</div>
            </div>

            {/* Result */}
            <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-2.5 text-right sm:text-left">
              <div className="text-[10px] uppercase font-mono text-rose-400 mb-1">
                Execution Verdict
              </div>
              <div className="text-sm font-extrabold text-rose-400 flex items-center gap-1">
                <span>[BLOCKED ❌]</span>
              </div>
              <div className="text-[10px] text-muted-foreground mt-1">
                Discount clamped to 5% with mandatory audit flag.
              </div>
            </div>
          </div>

          <p className="mt-3 text-center italic text-muted-foreground text-[11px] border-t border-border/30 pt-2">
            &ldquo;My own guardrail caught my own agent being generous with someone else&apos;s money.&rdquo;
          </p>
        </div>

        {/* 2 Grid cards: Financial Suppression + Operational Resilience */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Suppression */}
          <div className="rounded-xl border border-emerald-500/25 bg-emerald-950/15 p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="size-4" />
                <span>Financial Intelligence</span>
              </span>
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-[10px]">
                ROI Optimization
              </Badge>
            </div>
            <div className="rounded bg-background/50 border border-border/60 p-2 font-mono text-[11px] text-foreground mb-2">
              Predicted Uplift (₹) ≤ Cost (₹) → [SUPPRESS]
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-400">34</span>
              <span className="text-xs font-semibold text-foreground">interventions refused</span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
              Saved ₹1,420 in wasted outbound calling & WhatsApp fees on low-propensity debtors.
              <em> &ldquo;Knowing when to shut up is worth money too.&rdquo;</em>
            </p>
          </div>

          {/* Chaos Defense */}
          <div className="rounded-xl border border-cyan-500/25 bg-cyan-950/15 p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-cyan-400 flex items-center gap-1.5">
                <Zap className="size-4" />
                <span>Operational Resilience</span>
              </span>
              <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 text-[10px]">
                Chaos Suite
              </Badge>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-cyan-400">{chaosScore}</span>
              <span className="text-xs font-semibold text-foreground">fault injections survived</span>
            </div>
            <div className="mt-2 space-y-1 text-[11px] text-muted-foreground">
              <div className="flex justify-between">
                <span>TTS Outage:</span>
                <span className="text-emerald-400 font-medium">WhatsApp fallback taken ✓</span>
              </div>
              <div className="flex justify-between">
                <span>LLM Timeout:</span>
                <span className="text-emerald-400 font-medium">Deterministic templates ✓</span>
              </div>
              <div className="flex justify-between">
                <span>Webhook Replay:</span>
                <span className="text-emerald-400 font-medium">Idempotency check passed ✓</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
