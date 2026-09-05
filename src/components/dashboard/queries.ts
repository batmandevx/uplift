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
    },
  });
}
