"use client";

import { Lock, ShieldCheck, Keyboard } from "lucide-react";

export function SiteFooter() {
  return (
    <footer
      className="mt-auto w-full glass border-t border-border/40 backdrop-blur-xl relative"
      role="contentinfo"
    >
      <div className="h-[1px] w-full bg-linear-to-r from-transparent via-emerald-500/20 to-transparent" />
      <div className="mx-auto flex max-w-[1400px] flex-col items-start justify-between gap-3 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:px-6">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="grid size-5 place-items-center rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <ShieldCheck className="size-3.5 shrink-0" aria-hidden />
          </span>
          <span className="font-medium text-foreground/80">
            Compliant Debt-Recovery Orchestration · Pre-registered holdout ·
            Mandate-gated escalation · Hinglish stop rules
          </span>
        </p>
        <div className="flex items-center gap-4">
          <p className="hidden items-center gap-2 sm:flex">
            <Keyboard className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
            <span className="flex items-center gap-1.5">
              <kbd className="rounded border border-border/70 bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-foreground">S</kbd>
              <span className="opacity-70">stop</span>
              <kbd className="ml-1 rounded border border-border/70 bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-foreground">T</kbd>
              <span className="opacity-70">theme</span>
              <kbd className="ml-1 rounded border border-border/70 bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-foreground">B</kbd>
              <span className="opacity-70">batch</span>
              <kbd className="ml-1 rounded border border-border/70 bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-foreground">⌘K</kbd>
              <span className="opacity-70">commands</span>
              <kbd className="ml-1 rounded border border-border/70 bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-foreground">?</kbd>
              <span className="opacity-70">help</span>
            </span>
          </p>
          <p className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md">
            <Lock className="size-3" aria-hidden />
            <span>Audit log sealed</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
