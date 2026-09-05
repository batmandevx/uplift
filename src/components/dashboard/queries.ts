"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type {
  OverviewResponse,
  Batch,
  EscalationGate,
  StopRuleEvent,
  StopRuleResponse,
  ComplianceRules,
  FunnelRung,
  HoldoutComparison,
  RecoveryBucket,
  AuditEvent,
  LLMClassifyResponse,
  DebtorListItem,
  DebtorDetail,
  QuietHoursStatus,
  SealBatchResponse,
  BatchComparisonRow,
  MethodologyResponse,
  RecordAttemptResponse,
  ManualOptOutResponse,
  ComplianceGatesResponse,
  GateHistoryResponse,
} from "@/lib/dashboard-types";

async function jfetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText} — ${text}`.trim());
  }
  return (await res.json()) as T;
}

export function useOverview() {
  return useQuery<OverviewResponse>({
    queryKey: ["overview"],
    queryFn: () => jfetch<OverviewResponse>("/api/overview"),
  });
}

export function useBatches() {
  return useQuery<Batch[]>({
    queryKey: ["batches"],
    queryFn: () => jfetch<Batch[]>("/api/batches"),
  });
}

export function useEscalationGates(status = "PENDING") {
  return useQuery<EscalationGate[]>({
    queryKey: ["escalation-gates", status],
    queryFn: () =>
      jfetch<EscalationGate[]>(
        `/api/escalation-gates?status=${encodeURIComponent(status)}`
      ),
  });
}

export function useStopEvents(limit = 20) {
  return useQuery<StopRuleEvent[]>({
    queryKey: ["stop-events", limit],
    queryFn: () =>
      jfetch<StopRuleEvent[]>(`/api/stop-events?limit=${limit}`),
  });
}

export function useComplianceRules(batchId?: string) {
  return useQuery<ComplianceRules>({
    queryKey: ["compliance-rules", batchId],
    enabled: !!batchId,
    queryFn: () =>
      jfetch<ComplianceRules>(
        `/api/compliance-rules?batchId=${encodeURIComponent(batchId!)}`
      ),
  });
}

export function useEscalationFunnel(batchId?: string) {
  return useQuery<FunnelRung[]>({
    queryKey: ["escalation-funnel", batchId],
    enabled: !!batchId,
    queryFn: () =>
      jfetch<FunnelRung[]>(
        `/api/escalation-funnel?batchId=${encodeURIComponent(batchId!)}`
      ),
  });
}

export function useHoldoutComparison(batchId?: string) {
  return useQuery<HoldoutComparison>({
    queryKey: ["holdout-comparison", batchId],
    enabled: !!batchId,
    queryFn: () =>
      jfetch<HoldoutComparison>(
        `/api/holdout-comparison?batchId=${encodeURIComponent(batchId!)}`
      ),
  });
}

export function useRecoveryDistribution(batchId?: string) {
  return useQuery<RecoveryBucket[]>({
    queryKey: ["recovery-distribution", batchId],
    enabled: !!batchId,
    queryFn: () =>
      jfetch<RecoveryBucket[]>(
        `/api/recovery-distribution?batchId=${encodeURIComponent(batchId!)}`
      ),
  });
}

export function useAudit(limit = 50) {
  return useQuery<AuditEvent[]>({
    queryKey: ["audit", limit],
    queryFn: () => jfetch<AuditEvent[]>(`/api/audit?limit=${limit}`),
  });
}

export function useApproveGate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      jfetch<{ ok: true; gate: EscalationGate }>(
        `/api/escalation-gates/${id}/approve`,
        { method: "POST" }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["escalation-gates"] });
      qc.invalidateQueries({ queryKey: ["escalation-funnel"] });
      qc.invalidateQueries({ queryKey: ["overview"] });
      qc.invalidateQueries({ queryKey: ["audit"] });
    },
  });
}

export function useRejectGate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      jfetch<{ ok: true; gate: EscalationGate }>(
        `/api/escalation-gates/${id}/reject`,
        { method: "POST" }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["escalation-gates"] });
      qc.invalidateQueries({ queryKey: ["escalation-funnel"] });
      qc.invalidateQueries({ queryKey: ["overview"] });
      qc.invalidateQueries({ queryKey: ["audit"] });
    },
  });
}

export function useSubmitStopRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { phrase: string; debtorToken?: string }) =>
      jfetch<StopRuleResponse>(`/api/stop-rule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(args),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stop-events"] });
      qc.invalidateQueries({ queryKey: ["compliance-rules"] });
      qc.invalidateQueries({ queryKey: ["overview"] });
      qc.invalidateQueries({ queryKey: ["audit"] });
      qc.invalidateQueries({ queryKey: ["debtors"] });
    },
  });
}

// ---- Phase-2: LLM classify, debtor drill-down, quiet hours, seal batch ----

export function useLLMClassify() {
  return useMutation({
    mutationFn: (args: { phrase: string }) =>
      jfetch<LLMClassifyResponse>(`/api/stop-rule/classify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(args),
      }),
  });
}

export function useDebtors(
  batchId?: string,
  opts?: { q?: string; status?: string; limit?: number },
) {
  return useQuery<DebtorListItem[]>({
    queryKey: ["debtors", batchId, opts?.q ?? "", opts?.status ?? "all", opts?.limit ?? 100],
    enabled: !!batchId,
    queryFn: () => {
      const p = new URLSearchParams();
      p.set("batchId", batchId!);
      if (opts?.q) p.set("q", opts.q);
      if (opts?.status) p.set("status", opts.status);
      if (opts?.limit) p.set("limit", String(opts.limit));
      return jfetch<DebtorListItem[]>(`/api/debtors?${p.toString()}`);
    },
  });
}

export function useDebtorDetail(token?: string) {
  return useQuery<DebtorDetail>({
    queryKey: ["debtor", token],
    enabled: !!token,
    queryFn: () => jfetch<DebtorDetail>(`/api/debtors/${encodeURIComponent(token!)}`),
  });
}

export function useQuietHours() {
  return useQuery<QuietHoursStatus>({
    queryKey: ["quiet-hours"],
    queryFn: () => jfetch<QuietHoursStatus>(`/api/quiet-hours`),
    refetchInterval: 60_000, // refresh every minute
  });
}

export function useSealBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      jfetch<SealBatchResponse>(`/api/batches/${id}/seal`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["overview"] });
      qc.invalidateQueries({ queryKey: ["batches"] });
      qc.invalidateQueries({ queryKey: ["audit"] });
      qc.invalidateQueries({ queryKey: ["batch-comparison"] });
    },
  });
}

// ---- Phase-3: batch comparison, recovery trend ----

export function useBatchComparison() {
  return useQuery<BatchComparisonRow[]>({
    queryKey: ["batch-comparison"],
    queryFn: () => jfetch<BatchComparisonRow[]>(`/api/batch-comparison`),
  });
}

export function useRecoveryTrend(batchId?: string, days = 14) {
  return useQuery({
    queryKey: ["recovery-trend", batchId, days],
    enabled: !!batchId,
    queryFn: () =>
      jfetch<{ points: { day: string; cumulativeRecovered: number; dailyRecovered: number; attempts: number }[]; batchName: string }>(
        `/api/recovery-trend?batchId=${encodeURIComponent(batchId!)}&days=${days}`,
      ),
  });
}

// ---- Phase-4: methodology, debtor write actions ----

export function useMethodology(batchId?: string) {
  return useQuery<MethodologyResponse>({
    queryKey: ["methodology", batchId],
    enabled: !!batchId,
    queryFn: () =>
      jfetch<MethodologyResponse>(
        `/api/methodology?batchId=${encodeURIComponent(batchId!)}`,
      ),
  });
}

export function useRecordAttempt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      token: string;
      channel?: string;
      escalationLevel?: number;
      outcome: string;
      amountCollected?: number;
      transcriptSnippet?: string;
    }) =>
      jfetch<RecordAttemptResponse>(
        `/api/debtors/${encodeURIComponent(args.token)}/attempts`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            channel: args.channel,
            escalationLevel: args.escalationLevel,
            outcome: args.outcome,
            amountCollected: args.amountCollected,
            transcriptSnippet: args.transcriptSnippet,
          }),
        },
      ),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["debtor", vars.token] });
      qc.invalidateQueries({ queryKey: ["debtors"] });
      qc.invalidateQueries({ queryKey: ["overview"] });
      qc.invalidateQueries({ queryKey: ["recovery-trend"] });
      qc.invalidateQueries({ queryKey: ["audit"] });
    },
  });
}

export function useManualOptOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      token: string;
      reason?: string;
      rawPhrase?: string;
      language?: string;
    }) =>
      jfetch<ManualOptOutResponse>(
        `/api/debtors/${encodeURIComponent(args.token)}/opt-out`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reason: args.reason,
            rawPhrase: args.rawPhrase,
            language: args.language,
          }),
        },
      ),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["debtor", vars.token] });
      qc.invalidateQueries({ queryKey: ["debtors"] });
      qc.invalidateQueries({ queryKey: ["compliance-rules"] });
      qc.invalidateQueries({ queryKey: ["overview"] });
      qc.invalidateQueries({ queryKey: ["audit"] });
    },
  });
}

// ---- Phase-5: compliance-gate banner, batch scatter ----

export function useComplianceGates(batchId?: string) {
  return useQuery<ComplianceGatesResponse>({
    queryKey: ["compliance-gates", batchId],
    enabled: !!batchId,
    queryFn: () =>
      jfetch<ComplianceGatesResponse>(
        `/api/compliance-gates?batchId=${encodeURIComponent(batchId!)}`,
      ),
    refetchInterval: 60_000,
  });
}

export function useGateHistory(batchId?: string, hours = 24) {
  return useQuery<GateHistoryResponse>({
    queryKey: ["gate-history", batchId, hours],
    enabled: !!batchId,
    queryFn: () =>
      jfetch<GateHistoryResponse>(
        `/api/compliance-gates/history?batchId=${encodeURIComponent(batchId!)}&hours=${hours}`,
      ),
    refetchInterval: 5 * 60_000,
  });
}
