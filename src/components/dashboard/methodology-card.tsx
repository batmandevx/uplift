"use client";

import { motion } from "framer-motion";
import {
  FlaskConical,
  Fingerprint,
  Lock,
  Calendar,
  Target,
  Sigma,
  ShieldCheck,
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
import { Separator } from "@/components/ui/separator";
import { QueryError } from "./query-error";
import { useMethodology } from "./queries";
import { formatDateTime } from "@/lib/format";

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

export function MethodologyCard({ batchId }: { batchId?: string }) {
  const { data, isLoading, isError, error, refetch } = useMethodology(batchId);

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
          methodology hash proves immutability.
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

            {/* Methodology hash — the key "sealed" artifact */}
            <div className="relative overflow-hidden rounded-lg border border-violet-300/40 bg-violet-50/60 p-3 dark:bg-violet-950/30">
              <div className="flex items-center gap-2">
                <Fingerprint
                  className="size-4 shrink-0 text-violet-600 dark:text-violet-400"
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Methodology hash (FNV-1a)
                  </div>
                  <code className="mt-0.5 block font-mono text-sm font-semibold tracking-tight text-violet-700 dark:text-violet-300">
                    {data.methodologyHash}
                  </code>
                </div>
              </div>
              <p className="mt-2 text-[10px] text-muted-foreground">
                Computed from batch name, mandate, holdout ratio, and plan text.
                Any mutation invalidates the hash — proving the plan was locked.
              </p>
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
