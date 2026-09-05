"use client";

import { Lock, ShieldCheck } from "lucide-react";

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
        <p className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
          <Lock className="size-3.5" aria-hidden />
          <span>Audit log sealed</span>
        </p>
      </div>
    </footer>
  );
}
