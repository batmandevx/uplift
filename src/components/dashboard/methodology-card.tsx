"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FlaskConical,
  Fingerprint,
  Lock,
  Calendar,
  Target,
  Sigma,
  ShieldCheck,
  ShieldCheck as Check,
  ShieldAlert as Cross,
  Loader2,
  Copy,
  CheckCheck,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { QueryError } from "./query-error";
import { useMethodology } from "./queries";
import { formatDateTime } from "@/lib/format";
import { computeMethodologyHash } from "@/lib/methodology-hash";
import { toast } from "sonner";

function FieldRow({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: typeof Target;
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
        <Icon className="size-3.5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        <div
          className={`mt-0.5 text-sm font-medium ${mono ? "font-mono text-xs" : ""}`}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

type VerifyState = "idle" | "verifying" | "match" | "mismatch";

export function MethodologyCard({ batchId }: { batchId?: string }) {
  const { data, isLoading, isError, error, refetch } = useMethodology(batchId);
  const [verify, setVerify] = React.useState<VerifyState>("idle");
  const [recomputed, setRecomputed] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  function handleVerify() {
    if (!data) return;
    setVerify("verifying");
    // Simulate a brief computation delay for UX feedback
    setTimeout(() => {
      const hash = computeMethodologyHash({
        batchName: data.batchName,
        mandateLevel: data.mandateLevel,
        holdoutRatio: data.holdoutRatio,
        analysisPlan: data.analysisPlan,
      });
      setRecomputed(hash);
      const match = hash === data.methodologyHash;
      setVerify(match ? "match" : "mismatch");
      if (match) {
        toast.success("Hash verified", {
          description: "Recomputed hash matches the stored value. Plan is intact.",
        });
      } else {
        toast.error("Hash mismatch", {
          description: "The stored hash does not match the recomputed value. Plan may have been tampered with.",
        });
      }
    }, 600);
  }

  function handleCopy() {
    if (!data) return;
    navigator.clipboard
      .writeText(data.methodologyHash)
      .then(() => {
        setCopied(true);
        toast.success("Hash copied");
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => toast.error("Copy failed"));
  }

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FlaskConical className="size-4 text-violet-600 dark:text-violet-400" aria-hidden />
            <CardTitle>Methodology Pre-registration</CardTitle>
          </div>
          {data?.sealed && (
            <Badge
              variant="outline"
              className="gap-1 border-emerald-300/50 bg-emerald-100/70 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
            >
              <Lock className="size-3" aria-hidden />
              sealed
            </Badge>
          )}
        </div>
        <CardDescription>
          The analysis plan was locked before results were observed. The
          methodology hash proves immutability — verify it client-side.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isError ? (
          <QueryError message={error?.message} onRetry={() => refetch()} />
        ) : isLoading || !data ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full rounded-md" />
            <Skeleton className="h-20 w-full rounded-md" />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* Analysis plan */}
            <div className="rounded-lg border bg-muted/30 p-3">
              <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                <ShieldCheck className="size-3" aria-hidden />
                Pre-registered analysis plan
              </div>
              <p className="text-xs leading-relaxed text-foreground">
                {data.analysisPlan}
              </p>
            </div>

            {/* Methodology hash — the key "sealed" artifact + verify button */}
            <div className="relative overflow-hidden rounded-lg border border-violet-300/40 bg-violet-50/60 p-3 dark:bg-violet-950/30">
              <div className="flex items-start gap-2">
                <Fingerprint
                  className="mt-0.5 size-4 shrink-0 text-violet-600 dark:text-violet-400"
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Methodology hash (FNV-1a)
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-5"
                      onClick={handleCopy}
                      aria-label="Copy hash"
                    >
                      {copied ? (
                        <CheckCheck className="size-3 text-emerald-600" aria-hidden />
                      ) : (
                        <Copy className="size-3" aria-hidden />
                      )}
                    </Button>
                  </div>
                  <code className="mt-0.5 block break-all font-mono text-sm font-semibold tracking-tight text-violet-700 dark:text-violet-300">
                    {data.methodologyHash}
                  </code>
                  <p className="mt-1.5 text-[10px] text-muted-foreground">
                    Computed from batch name, mandate, holdout ratio, and plan
                    text. Any mutation invalidates the hash.
                  </p>
                </div>
              </div>

              {/* Verify button + result */}
              <div className="mt-3 flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleVerify}
                  disabled={verify === "verifying"}
                  className="h-7 gap-1.5 border-violet-300/50 bg-background text-xs text-violet-700 hover:bg-violet-50 dark:text-violet-300 dark:hover:bg-violet-950/40"
                  aria-label="Recompute the hash client-side and verify it matches"
                >
                  {verify === "verifying" ? (
                    <Loader2 className="size-3 animate-spin" aria-hidden />
                  ) : (
                    <Fingerprint className="size-3" aria-hidden />
                  )}
                  {verify === "verifying" ? "Verifying…" : "Verify hash"}
                </Button>
                <AnimatePresence>
                  {verify === "match" && (
                    <motion.div
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400"
                      role="status"
                      aria-live="polite"
                    >
                      <Check className="size-3.5" aria-hidden />
                      Verified — plan intact
                    </motion.div>
                  )}
                  {verify === "mismatch" && (
                    <motion.div
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      className="flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400"
                      role="status"
                      aria-live="polite"
                    >
                      <Cross className="size-3.5" aria-hidden />
                      Mismatch — possible tampering
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Recomputed hash (shown after verify) */}
              <AnimatePresence>
                {recomputed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2 rounded-md bg-background/70 p-2 text-[10px]">
                      <span className="text-muted-foreground">
                        Recomputed:{" "}
                      </span>
                      <code className="font-mono font-semibold text-foreground">
                        {recomputed}
                      </code>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Separator />

            {/* Parameter grid */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FieldRow
                icon={Calendar}
                label="Pre-registered at"
                value={formatDateTime(data.preRegisteredAt)}
              />
              <FieldRow
                icon={Target}
                label="Primary metric"
                value={
                  <code className="font-mono text-xs">
                    {data.primaryMetric.replace(/_/g, " ")}
                  </code>
                }
              />
              <FieldRow
                icon={Sigma}
                label="Significance level"
                value={`α = ${data.significanceLevel}`}
              />
              <FieldRow
                icon={Lock}
                label="Holdout ratio"
                value={`${Math.round(data.holdoutRatio * 100)}% (pre-registered)`}
              />
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
