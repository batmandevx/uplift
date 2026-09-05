"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileCheck2,
  Copy,
  Check,
  ShieldCheck,
  Download,
  Lock,
  ExternalLink,
  Terminal,
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
import { toast } from "sonner";

export interface ReceiptData {
  transactionId: string;
  debtorToken: string;
  mandateUsed: string;
  mandateSignature: string;
  status: "RESOLVED" | "VERIFIED" | "PENDING";
  amountRecovered: number;
  interventionCost: number;
  counterfactualEstimatePct: number;
  netUplift: number;
  hash: string;
  timestamp: string;
  verifiedBy: string;
}

const DEFAULT_RECEIPT: ReceiptData = {
  transactionId: "TXN-2026-0906-8812",
  debtorToken: "deb_7a2f91c",
  mandateUsed: "uplift/policy-v1.3",
  mandateSignature: "ed25519:6a8b9c44f192ba83e10884d91c2b5e783a210d44b92c",
  status: "RESOLVED",
  amountRecovered: 4000,
  interventionCost: 4.5,
  counterfactualEstimatePct: 34.8,
  netUplift: 3995.5,
  hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  timestamp: "2026-09-06T01:14:22.842Z",
  verifiedBy: "SHA-256 Hash Chain // Postgres Append-Only Ledger",
};

export function RecoveryReceiptModal({
  receipt = DEFAULT_RECEIPT,
  trigger,
  isOpen,
  onOpenChange,
}: {
  receipt?: ReceiptData;
  trigger?: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [copied, setCopied] = React.useState(false);

  function copyHash() {
    navigator.clipboard.writeText(receipt.hash);
    setCopied(true);
    toast.success("Receipt Hash Copied", {
      description: "SHA-256 cryptographic verification token copied to clipboard.",
    });
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadReceiptJSON() {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(receipt, null, 2));
    const a = document.createElement("a");
    a.setAttribute("href", dataStr);
    a.setAttribute("download", `receipt-${receipt.transactionId}.json`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Receipt Downloaded", {
      description: `Cryptographic proof saved for ${receipt.debtorToken}`,
    });
  }

  const content = (
    <div className="space-y-4 pt-2">
      {/* Receipt Terminal Box */}
      <div className="relative rounded-xl border border-emerald-500/30 bg-black/85 p-4 text-xs font-mono text-emerald-400 shadow-2xl backdrop-blur-xl">
        {/* Top decorative scanline bar */}
        <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2 mb-3">
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <Terminal className="size-3.5" />
            <span>AGENTIC_PROTOCOL_V1.0 // PROOF_LAYER</span>
          </div>
          <Badge
            variant="outline"
            className="border-emerald-500/40 bg-emerald-500/15 text-emerald-400 text-[10px] uppercase tracking-wider"
          >
            ● {receipt.status}
          </Badge>
        </div>

        <div className="space-y-2 text-zinc-300">
          <div className="flex justify-between border-b border-zinc-800/80 pb-1">
            <span className="text-zinc-500">TRANSACTION:</span>
            <span className="font-semibold text-zinc-100">{receipt.transactionId}</span>
          </div>
          <div className="flex justify-between border-b border-zinc-800/80 pb-1">
            <span className="text-zinc-500">DEBTOR REF (HASHED):</span>
            <span className="font-semibold text-emerald-300">{receipt.debtorToken}</span>
          </div>
          <div className="flex justify-between border-b border-zinc-800/80 pb-1">
            <span className="text-zinc-500">MANDATE USED:</span>
            <span className="text-cyan-300 font-semibold">{receipt.mandateUsed}</span>
          </div>
          <div className="flex justify-between border-b border-zinc-800/80 pb-1">
            <span className="text-zinc-500">MANDATE SIGNATURE:</span>
            <span className="truncate max-w-[200px] text-zinc-400 font-mono text-[10px]">
              {receipt.mandateSignature}
            </span>
          </div>
          <div className="flex justify-between border-b border-zinc-800/80 pb-1">
            <span className="text-zinc-500">GROSS RECOVERED:</span>
            <span className="font-bold text-emerald-400 text-sm">
              ₹{receipt.amountRecovered.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="flex justify-between border-b border-zinc-800/80 pb-1">
            <span className="text-zinc-500">INTERVENTION COST:</span>
            <span className="text-zinc-300">₹{receipt.interventionCost.toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-b border-zinc-800/80 pb-1">
            <span className="text-zinc-500">COUNTERFACTUAL EST:</span>
            <span className="text-amber-400 font-semibold">
              {receipt.counterfactualEstimatePct}% natural self-recovery
            </span>
          </div>
          <div className="flex justify-between border-b border-zinc-800/80 pb-1">
            <span className="text-zinc-500">NET VERIFIED UPLIFT:</span>
            <span className="font-extrabold text-emerald-400 text-sm">
              +₹{receipt.netUplift.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* Cryptographic Hash Section */}
        <div className="mt-3.5 rounded-lg bg-zinc-950/80 border border-zinc-800 p-2.5">
          <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
            <span className="flex items-center gap-1">
              <Lock className="size-3 text-emerald-400" />
              <span>SHA-256 RECEIPT HASH</span>
            </span>
            <button
              onClick={copyHash}
              className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
            >
              {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>
          <p className="break-all font-mono text-[10px] text-amber-300/90 leading-tight">
            {receipt.hash}
          </p>
        </div>

        <div className="mt-2.5 flex items-center justify-between text-[10px] text-zinc-500">
          <span>PII HASHED AT BOUNDARY</span>
          <span>APPEND-ONLY LEDGER</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 pt-1">
        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
          <ShieldCheck className="size-3.5 text-emerald-500" />
          <span>Proof layer verified against pre-registered holdout baseline</span>
        </p>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={downloadReceiptJSON}
            className="h-8 gap-1.5 text-xs border-border/80 hover:bg-accent"
          >
            <Download className="size-3.5" />
            <span>Download Proof</span>
          </Button>
        </div>
      </div>
    </div>
  );

  if (trigger) {
    return (
      <Dialog>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent className="glass max-w-lg border-emerald-500/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <FileCheck2 className="size-5 text-emerald-500" />
              <span>Cryptographic Recovery Receipt (Saboot)</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Immutable receipt proving causal revenue recovery without unearned attribution.
            </DialogDescription>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="glass max-w-lg border-emerald-500/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
            <FileCheck2 className="size-5 text-emerald-500" />
            <span>Cryptographic Recovery Receipt (Saboot)</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Immutable receipt proving causal revenue recovery without unearned attribution.
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
