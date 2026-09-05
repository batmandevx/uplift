// Shared frontend types matching the API contract (Task 2-b).
// Kept loose (no Prisma imports) so they can be used from client components.

export type BatchStatus = "RUNNING" | "SEALED" | "DRAFT" | "CLOSED";

export interface Batch {
  id: string;
  name: string;
  region: string;
  mandateLevel: string;
  holdoutRatio: number;
  status: BatchStatus;
  startedAt: string;
  closedAt?: string | null;
  debtorCount: number;
  recoveredTotal: number;
}

export interface KPIs {
  totalRecovered: number;
  incrementalRupees: number;
  incrementalPct: number;
  holdoutRatio: number;
  treatedN: number;
  holdoutN: number;
  treatedMean: number;
  holdoutMean: number;
  treatedCI: [number, number];
  holdoutCI: [number, number];
}

export interface SealedValidation {
  estimateRupees: number;
  sealedTruthRupees: number;
  deltaRupees: number;
  deltaPct: number;
  validated: boolean;
}

export interface OverviewResponse {
  batch: Batch;
  kpis: KPIs;
  sealedValidation: SealedValidation;
}

export type EscalationGateStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface EscalationGate {
  id: string;
  debtorToken: string;
  fromLevel: number;
  toLevel: number;
  rationale: string;
  requestedAt: string;
  status: EscalationGateStatus;
}

export type DetectedLanguage = "en" | "hi" | "hinglish";

export interface StopRuleEvent {
  id: string;
  debtorToken: string;
  rawPhrase: string;
  detectedLanguage: DetectedLanguage;
  matchedRule: string;
  actionTaken: string;
  confidence: number;
  at: string;
}

export interface OptOutRecord {
  id: string;
  debtorToken: string;
  reason: string;
  createdAt: string;
}

export interface StopRuleResponse {
  ok: boolean;
  event: StopRuleEvent;
  optOutRecord: OptOutRecord;
}

export interface ComplianceLadderRung {
  level: number;
  label: string;
  description: string;
}

export interface ComplianceRules {
  mandateLevel: string;
  quietHoursStart: string;
  quietHoursEnd: string;
  dailyAttemptCap: number;
  totalAttemptCap: number;
  optOutCount: number;
  humanApprovalRequiredFromRung: number;
  ladder: ComplianceLadderRung[];
}

export interface FunnelRung {
  level: number;
  label: string;
  count: number;
}

export interface HoldoutGroup {
  n: number;
  mean: number;
  ci: [number, number];
  total: number;
}

export interface HoldoutComparison {
  treated: HoldoutGroup;
  holdout: HoldoutGroup;
}

export interface RecoveryBucket {
  bucket: string;
  treated: number;
  holdout: number;
}

export interface AuditEvent {
  id: string;
  at: string;
  actor: string;
  action: string;
  detail?: string;
}

// ---- Phase-2 additions (LLM classify, debtor drill-down, seal, quiet hours) ----

export interface LLMClassifyRequest {
  phrase: string;
}

export interface LLMClassifyResponse {
  ok: boolean;
  isStopRequest: boolean;
  language: DetectedLanguage;
  confidence: number; // 0..1
  intent: string; // short label e.g. "stop outreach" | "request callback" | "payment query"
  reasoning: string;
  rule: string; // STOP_EN | STOP_HI | STOP_HINGLISH | LLM_FUZZY | NONE
}

export interface DebtorListItem {
  id: string;
  token: string;
  region: string;
  preferredLanguage: string;
  outstandingAmount: number;
  recoveredAmount: number;
  isHoldout: boolean;
  optOut: boolean;
  currentLevel: number;
  attemptCountTotal: number;
  lastAttemptAt?: string | null;
}

export interface DebtorAttempt {
  id: string;
  channel: string;
  escalationLevel: number;
  outcome: string;
  amountCollected: number;
  transcriptSnippet?: string | null;
  attemptedAt: string;
}

export interface DebtorOptOut {
  id: string;
  source: string;
  reason: string;
  rawPhrase?: string | null;
  language: string;
  detectedAt: string;
}

export interface DebtorDetail {
  id: string;
  token: string;
  region: string;
  preferredLanguage: string;
  outstandingAmount: number;
  recoveredAmount: number;
  isHoldout: boolean;
  optOut: boolean;
  optOutReason?: string | null;
  stoppedReason?: string | null;
  currentLevel: number;
  attemptCountToday: number;
  attemptCountTotal: number;
  lastAttemptAt?: string | null;
  batchId: string;
  batchName: string;
  recoveryPct: number;
  attempts: DebtorAttempt[];
  optOuts: DebtorOptOut[];
  audit: AuditEvent[];
}

export interface QuietHoursStatus {
  nowIst: string; // HH:mm
  insideQuietHours: boolean;
  windowStart: string;
  windowEnd: string;
  nextChangeInMinutes: number;
  outreachSuppressed: boolean;
}

export interface SealBatchResponse {
  ok: boolean;
  batch: {
    id: string;
    name: string;
    status: string;
    closedAt: string;
  };
  groundTruth: {
    treatedN: number;
    holdoutN: number;
    incrementalRupees: number;
  };
}

// ---- Phase-3 additions (batch comparison, recovery trend, audit timeline) ----

export interface BatchComparisonRow {
  batchId: string;
  batchName: string;
  status: BatchStatus;
  mandateLevel: string;
  holdoutRatio: number;
  debtorCount: number;
  treatedN: number;
  holdoutN: number;
  treatedMean: number;
  holdoutMean: number;
  treatedCI: [number, number];
  holdoutCI: [number, number];
  incrementalRupees: number;
  liftPct: number;
  totalRecovered: number;
  closedAt?: string | null;
}

export interface RecoveryTrendPoint {
  day: string; // ISO date (yyyy-mm-dd)
  cumulativeRecovered: number;
  dailyRecovered: number;
  attempts: number;
}

export interface RecoveryTrendResponse {
  points: RecoveryTrendPoint[];
  batchName: string;
}

export interface AuditTimelineGroup {
  date: string; // yyyy-mm-dd
  label: string; // e.g. "12 Sep"
  events: AuditEvent[];
}

// ---- Phase-4 additions (methodology pre-registration, debtor write actions) ----

export interface MethodologyResponse {
  batchId: string;
  batchName: string;
  status: BatchStatus;
  mandateLevel: string;
  holdoutRatio: number;
  analysisPlan: string;
  methodologyHash: string;
  preRegisteredAt: string;
  primaryMetric: string;
  significanceLevel: number;
  startedAt?: string | null;
  sealed: boolean; // true once status !== DRAFT (methodology immutable)
}

export interface RecordAttemptResponse {
  ok: boolean;
  attempt: {
    id: string;
    channel: string;
    escalationLevel: number;
    outcome: string;
    amountCollected: number;
    transcriptSnippet?: string | null;
    attemptedAt: string;
  };
  debtor: {
    token: string;
    recoveredAmount: number;
    attemptCountTotal: number;
  };
}

export interface ManualOptOutResponse {
  ok: boolean;
  optOutRecord: {
    id: string;
    debtorToken: string;
    reason: string;
    rawPhrase?: string | null;
    language: string;
    detectedAt: string;
  };
  debtor: {
    token: string;
    optOut: boolean;
    optOutReason: string | null;
  };
}

// ---- Phase-5 additions (compliance-gate banner, batch scatter) ----

export type GateState = "passing" | "blocking" | "pending" | "active";

export interface ComplianceGate {
  key: string;
  label: string;
  state: GateState;
  detail: string;
  icon: string;
}

export interface ComplianceGatesResponse {
  nowIst: string;
  gates: ComplianceGate[];
  summary: {
    blocking: number;
    pending: number;
    active: number;
    passing: number;
  };
}

export interface GateHistoryPoint {
  at: string;
  state: GateState;
}

export interface GateHistoryResponse {
  hours: number;
  gates: { gateKey: string; points: GateHistoryPoint[] }[];
}
