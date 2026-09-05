"use client";

import {
  ShieldCheck,
  Clock,
  Ban,
  UserCheck,
  PhoneOff,
  Gavel,
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
import { QueryError } from "./query-error";
import { useComplianceRules } from "./queries";
import { formatNumber } from "@/lib/format";

function RuleRow({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Clock;
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-card/60 p-3">
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-md bg-muted text-foreground">
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="mt-0.5 text-sm font-medium">{value}</div>
        {hint && (
          <div className="mt-0.5 text-[11px] text-muted-foreground">{hint}</div>
        )}
      </div>
    </div>
  );
}

export function ComplianceRulesPanel({ batchId }: { batchId?: string }) {
  const { data, isLoading, isError, error, refetch } = useComplianceRules(batchId);

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden />
          <CardTitle>Compliance Rules</CardTitle>
        </div>
        <CardDescription>
          Active constraints for the selected batch. All outreach must satisfy
          these gates.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isError ? (
          <QueryError message={error?.message} onRetry={() => refetch()} />
        ) : isLoading || !data ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <RuleRow
              icon={Gavel}
              label="Mandate level"
              value={
                <Badge
                  variant="outline"
                  className="border-emerald-300/50 bg-emerald-100/70 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                >
                  {data.mandateLevel}
                </Badge>
              }
            />
            <RuleRow
              icon={Clock}
              label="Quiet hours"
              value={
                <span className="tabular-nums">
                  {data.quietHoursStart} – {data.quietHoursEnd} IST
                </span>
              }
              hint="No outbound calls/messages in this window"
            />
            <RuleRow
              icon={PhoneOff}
              label="Daily attempt cap"
              value={<span className="tabular-nums">{data.dailyAttemptCap} / debtor / day</span>}
            />
            <RuleRow
              icon={Ban}
              label="Total attempt cap"
              value={<span className="tabular-nums">{data.totalAttemptCap} / debtor / batch</span>}
            />
            <RuleRow
              icon={Ban}
              label="Opt-out registry"
              value={<span className="tabular-nums">{formatNumber(data.optOutCount)} opted-out</span>}
              hint="Suppressed from all outreach"
            />
            <RuleRow
              icon={UserCheck}
              label="Human-approval gate"
              value={
                <span>
                  Required from{" "}
                  <Badge variant="outline" className="ml-1 border-amber-300/50 bg-amber-100/70 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                    rung ≥ {data.humanApprovalRequiredFromRung}
                  </Badge>
                </span>
              }
              hint="Enhanced Outreach & Legal Notice Referral"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
