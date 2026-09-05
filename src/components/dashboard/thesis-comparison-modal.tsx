"use client";

import * as React from "react";
import {
  Scale,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ShieldCheck,
  Zap,
  Lock,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function ThesisComparisonModal({ trigger }: { trigger?: React.ReactNode }) {
  const comparisonData = [
    {
      dimension: "Target Metric",
      standard: "Success Rate (Raw Activity)",
      standardNote: "Takes credit for debtors who would have paid anyway",
      uplift: "Incremental Uplift vs Holdout (Attribution)",
      upliftNote: "Proves only the money directly caused by the agent with 95% Wilson CI",
      isWin: true,
    },
    {
      dimension: "Outage Handling",
      standard: "Blind Retries 💥",
      standardNote: "Wastes gateway fees and spams users when bank rails are down",
      uplift: "Radar Degradation-Aware Pausing 🛡️",
      upliftNote: "Pauses retries during bank maintenance or Z-Score anomalies (σ > 3.0)",
      isWin: true,
    },
    {
      dimension: "AI Placement",
      standard: "In the Money Path",
      standardNote: "LLM directly issues discounts and moves funds — risk of hallucination",
      uplift: "Conversation & Diagnosis Only",
      upliftNote: "Ed25519 Signed Mandates. 5% hard discount cap. Deterministic execution.",
      isWin: true,
    },
    {
      dimension: "Auditability",
      standard: "Standard Application Logs 📄",
      standardNote: "Mutable, unverified, prone to dispute by merchants and CFOs",
      uplift: "Cryptographic Hash-Chained Receipts (Saboot) 🔗",
      upliftNote: "SHA-256 ledger with PII hashed at boundary. Verifiable receipts.",
      isWin: true,
    },
    {
      dimension: "Intervention Cost",
      standard: "Unbounded Exhaustion",
      standardNote: "Contacts every debtor until block or max attempt reached",
      uplift: "Cost-Benefit Suppression Intelligence 💡",
      upliftNote: "Suppresses outreach when Predicted Uplift (₹) ≤ Intervention Cost (₹)",
      isWin: true,
    },
  ];

  const content = (
    <div className="space-y-4 pt-2">
      <div className="rounded-xl border border-border/80 overflow-hidden bg-card/60 shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border/80 bg-muted/50 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="p-3">Dimension</th>
                <th className="p-3 text-rose-500 dark:text-rose-400">Standard AI Recovery</th>
                <th className="p-3 text-emerald-500 dark:text-emerald-400 bg-emerald-500/5">
                  Uplift v2 Architecture
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {comparisonData.map((row, i) => (
                <tr key={i} className="hover:bg-muted/30 transition-colors">
                  <td className="p-3 font-semibold text-foreground whitespace-nowrap align-top">
                    {row.dimension}
                  </td>
                  <td className="p-3 align-top text-muted-foreground">
                    <div className="flex items-center gap-1.5 font-medium text-foreground/90">
                      <XCircle className="size-3.5 text-rose-500 shrink-0" />
                      <span>{row.standard}</span>
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground/80 leading-relaxed">
                      {row.standardNote}
                    </div>
                  </td>
                  <td className="p-3 align-top bg-emerald-500/5">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                      <span>{row.uplift}</span>
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                      {row.upliftNote}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-3 text-xs text-center text-emerald-300">
        &ldquo;Half of failed payments recover on their own. Merchants can&apos;t tell which half. Uplift can.&rdquo;
      </div>
    </div>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 text-xs font-semibold border-border/80 hover:bg-accent"
          >
            <Scale className="size-3.5 text-emerald-500" />
            <span>Why Uplift (Diagnostic Matrix)</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="glass max-w-3xl border-emerald-500/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
            <Scale className="size-5 text-emerald-500" />
            <span>Diagnostic Comparison: Standard AI vs Uplift v2</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            How Uplift solves the 3 deadly blind spots: Wasted Gateway Fees, Customer Spam, and Unearned Attribution.
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
