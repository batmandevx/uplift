import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  LADDER,
  QUIET_HOURS,
  DAILY_ATTEMPT_CAP,
  TOTAL_ATTEMPT_CAP,
  HUMAN_APPROVAL_FROM_RUNG,
} from "@/lib/recovery-stats";

// GET /api/compliance-rules?batchId=...
export async function GET(req: NextRequest) {
  const batchId = req.nextUrl.searchParams.get("batchId");
  if (!batchId) {
    return NextResponse.json(
      { error: "Missing batchId" },
      { status: 400 },
    );
  }

  const batch = await db.recoveryBatch.findUnique({ where: { id: batchId } });
  if (!batch) {
    return NextResponse.json({ error: "Batch not found" }, { status: 404 });
  }

  const optOutCount = await db.debtor.count({
    where: { batchId, optOut: true },
  });

  return NextResponse.json({
    mandateLevel: batch.mandateLevel,
    quietHoursStart: QUIET_HOURS.start,
    quietHoursEnd: QUIET_HOURS.end,
    dailyAttemptCap: DAILY_ATTEMPT_CAP,
    totalAttemptCap: TOTAL_ATTEMPT_CAP,
    optOutCount,
    humanApprovalRequiredFromRung: HUMAN_APPROVAL_FROM_RUNG,
    ladder: LADDER.map((r) => ({
      level: r.level,
      label: r.label,
      description: r.description,
    })),
  });
}
