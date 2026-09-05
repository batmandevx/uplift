"use client";

import { Lock, ShieldCheck, Keyboard } from "lucide-react";

export function SiteFooter() {
  return (
    <footer
      className="mt-auto w-full border-t bg-background"
      role="contentinfo"
    >
      <div className="mx-auto flex max-w-[1400px] flex-col items-start justify-between gap-2 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:px-6">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <ShieldCheck className="size-3.5 shrink-0" aria-hidden />
          <span>
            Compliant Debt-Recovery Orchestration · Pre-registered holdout ·
            Mandate-gated escalation · Hinglish stop rules
          </span>
        </p>
        <div className="flex items-center gap-3">
          <p className="hidden items-center gap-1.5 sm:flex">
            <Keyboard className="size-3.5 shrink-0" aria-hidden />
            <span className="flex items-center gap-1">
              <kbd className="rounded border bg-muted/60 px-1 py-px font-mono text-[9px]">S</kbd>
              <span className="opacity-60">stop</span>
              <kbd className="ml-1 rounded border bg-muted/60 px-1 py-px font-mono text-[9px]">T</kbd>
              <span className="opacity-60">theme</span>
              <kbd className="ml-1 rounded border bg-muted/60 px-1 py-px font-mono text-[9px]">B</kbd>
              <span className="opacity-60">batch</span>
              <kbd className="ml-1 rounded border bg-muted/60 px-1 py-px font-mono text-[9px]">⌘K</kbd>
              <span className="opacity-60">commands</span>
              <kbd className="ml-1 rounded border bg-muted/60 px-1 py-px font-mono text-[9px]">?</kbd>
              <span className="opacity-60">help</span>
            </span>
          </p>
          <p className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <Lock className="size-3.5" aria-hidden />
            <span>Audit log sealed</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
