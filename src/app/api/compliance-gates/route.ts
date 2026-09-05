import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  QUIET_HOURS,
  DAILY_ATTEMPT_CAP,
  TOTAL_ATTEMPT_CAP,
  HUMAN_APPROVAL_FROM_RUNG,
} from "@/lib/recovery-stats";

// GET /api/compliance-gates?batchId=
// Returns the live state of every compliance gate for a batch — which are
// currently blocking outreach and why. Used by the ComplianceGateBanner.
export async function GET(req: NextRequest) {
  const batchId = req.nextUrl.searchParams.get("batchId");
  if (!batchId) {
    return NextResponse.json({ error: "Missing batchId" }, { status: 400 });
  }

  const batch = await db.recoveryBatch.findUnique({
    where: { id: batchId },
    select: { id: true, status: true, mandateLevel: true },
  });
  if (!batch) {
    return NextResponse.json({ error: "Batch not found" }, { status: 404 });
  }

  // 1) Quiet hours gate (IST = UTC + 5:30)
  const now = new Date();
  const istMs = now.getTime() + (5 * 60 + 30) * 60 * 1000;
  const ist = new Date(istMs);
  const istMin = ist.getUTCHours() * 60 + ist.getUTCMinutes();
  const istHours = String(ist.getUTCHours()).padStart(2, "0");
  const istMins = String(ist.getUTCMinutes()).padStart(2, "0");
  const [sh, sm] = QUIET_HOURS.start.split(":").map(Number);
  const [eh, em] = QUIET_HOURS.end.split(":").map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  const insideQuiet = istMin >= startMin || istMin < endMin;
  let minutesToChange: number;
  if (insideQuiet) {
    minutesToChange =
      istMin < endMin ? endMin - istMin : 24 * 60 - istMin + endMin;
  } else {
    minutesToChange =
      istMin < startMin ? startMin - istMin : 24 * 60 - istMin + startMin;
  }

  // 2) Opt-out registry gate
  const optOutCount = await db.debtor.count({
    where: { batchId, optOut: true },
  });

  // 3) Pending human-approval gates
  const pendingGates = await db.escalationGate.count({
    where: { batchId, status: "PENDING" },
  });

  // 4) Debtors at/near attempt caps
  const atDailyCap = await db.debtor.count({
    where: { batchId, attemptCountToday: { gte: DAILY_ATTEMPT_CAP } },
  });
  const atTotalCap = await db.debtor.count({
    where: { batchId, attemptCountTotal: { gte: TOTAL_ATTEMPT_CAP } },
  });

  // 5) Batch lifecycle gate
  const batchNotRunning = batch.status !== "RUNNING";

  return NextResponse.json({
    nowIst: `${istHours}:${istMins}`,
    gates: [
      {
        key: "quiet-hours",
        label: "Quiet hours",
        state: insideQuiet ? "blocking" : "passing",
        detail: insideQuiet
          ? `Outreach suppressed until ${QUIET_HOURS.end} IST (${Math.floor(
              minutesToChange / 60,
            )}h ${minutesToChange % 60}m remaining)`
          : `Outreach allowed until ${QUIET_HOURS.start} IST`,
        icon: "moon",
      },
      {
        key: "opt-out-registry",
        label: "Opt-out registry",
        state: optOutCount > 0 ? "active" : "passing",
        detail: `${optOutCount} debtor${optOutCount !== 1 ? "s" : ""} suppressed from all outreach`,
        icon: "ban",
      },
      {
        key: "human-approval",
        label: "Human-approval gate",
        state: pendingGates > 0 ? "pending" : "passing",
        detail:
          pendingGates > 0
            ? `${pendingGates} escalation${pendingGates !== 1 ? "s" : ""} awaiting approval (rung ≥ ${HUMAN_APPROVAL_FROM_RUNG})`
            : `No escalations pending. Gate required from rung ${HUMAN_APPROVAL_FROM_RUNG}.`,
        icon: "user-check",
      },
      {
        key: "daily-cap",
        label: "Daily attempt cap",
        state: atDailyCap > 0 ? "active" : "passing",
        detail: `${atDailyCap} debtor${atDailyCap !== 1 ? "s" : ""} at daily cap (${DAILY_ATTEMPT_CAP}/day)`,
        icon: "gauge",
      },
      {
        key: "total-cap",
        label: "Total attempt cap",
        state: atTotalCap > 0 ? "active" : "passing",
        detail: `${atTotalCap} debtor${atTotalCap !== 1 ? "s" : ""} at total cap (${TOTAL_ATTEMPT_CAP}/batch)`,
        icon: "gauge",
      },
      {
        key: "batch-lifecycle",
        label: "Batch lifecycle",
        state: batchNotRunning ? "blocking" : "passing",
        detail: batchNotRunning
          ? `Batch is ${batch.status} — outreach paused`
          : "Batch RUNNING — outreach active",
        icon: "activity",
      },
    ],
    summary: {
      blocking: insideQuiet || batchNotRunning ? 1 : 0,
      pending: pendingGates > 0 ? 1 : 0,
      active: (optOutCount > 0 ? 1 : 0) + (atDailyCap > 0 ? 1 : 0) + (atTotalCap > 0 ? 1 : 0),
      passing: 6 - (insideQuiet || batchNotRunning ? 1 : 0) - (pendingGates > 0 ? 1 : 0) - (optOutCount > 0 ? 1 : 0) - (atDailyCap > 0 ? 1 : 0) - (atTotalCap > 0 ? 1 : 0),
    },
  });
}
