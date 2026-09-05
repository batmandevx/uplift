import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { round0 } from "@/lib/recovery-stats";
import {
  DAILY_ATTEMPT_CAP,
  QUIET_HOURS,
} from "@/lib/recovery-stats";

// POST /api/debtors/[token]/attempts
// Body: { channel?, escalationLevel?, outcome, amountCollected?, transcriptSnippet? }
//
// Records a new outreach attempt against a debtor. Enforces the daily
// attempt cap (3/day) and quiet-hours window (21:00–08:00 IST). Writes an
// audit event. Returns the created attempt + updated debtor totals.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const body = await req.json().catch(() => null) as {
    channel?: string;
    escalationLevel?: number;
    outcome?: string;
    amountCollected?: number;
    transcriptSnippet?: string;
  } | null;

  if (!body || !body.outcome) {
    return NextResponse.json(
      { error: "Missing 'outcome' in body" },
      { status: 400 },
    );
  }

  const debtor = await db.debtor.findUnique({
    where: { token },
    include: { batch: true },
  });
  if (!debtor) {
    return NextResponse.json({ error: "Debtor not found" }, { status: 404 });
  }

  // Compliance gate 1: opt-out registry
  if (debtor.optOut) {
    return NextResponse.json(
      {
        error: "Debtor is opted-out. Outreach is suppressed.",
        optOut: true,
      },
      { status: 409 },
    );
  }

  // Compliance gate 2: quiet hours (IST = UTC + 5:30)
  const now = new Date();
  const istMs = now.getTime() + (5 * 60 + 30) * 60 * 1000;
  const ist = new Date(istMs);
  const istMin = ist.getUTCHours() * 60 + ist.getUTCMinutes();
  const [sh, sm] = QUIET_HOURS.start.split(":").map(Number);
  const [eh, em] = QUIET_HOURS.end.split(":").map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  const insideQuiet = istMin >= startMin || istMin < endMin;
  if (insideQuiet) {
    return NextResponse.json(
      {
        error: `Quiet hours active (${QUIET_HOURS.start}–${QUIET_HOURS.end} IST). Outreach suppressed.`,
        quietHours: true,
      },
      { status: 409 },
    );
  }

  // Compliance gate 3: daily attempt cap
  // (Simplified: reset countToday if last attempt was > 24h ago)
  if (debtor.attemptCountToday >= DAILY_ATTEMPT_CAP) {
    return NextResponse.json(
      {
        error: `Daily attempt cap reached (${DAILY_ATTEMPT_CAP}/debtor/day).`,
        dailyCap: true,
      },
      { status: 409 },
    );
  }

  const channel = body.channel || "VOICE";
  const escalationLevel = Math.min(3, Math.max(0, body.escalationLevel ?? debtor.currentLevel));
  const outcome = body.outcome;
  const amountCollected = round0(Math.max(0, body.amountCollected ?? 0));
  const transcriptSnippet = body.transcriptSnippet ?? null;

  const attempt = await db.recoveryAttempt.create({
    data: {
      batchId: debtor.batchId,
      debtorId: debtor.id,
      channel,
      escalationLevel,
      outcome,
      amountCollected,
      transcriptSnippet,
      attemptedAt: now,
    },
  });

  // Update debtor totals
  const newRecovered = round0(debtor.recoveredAmount + amountCollected);
  const updated = await db.debtor.update({
    where: { id: debtor.id },
    data: {
      recoveredAmount: newRecovered,
      attemptCountToday: debtor.attemptCountToday + 1,
      attemptCountTotal: debtor.attemptCountTotal + 1,
      lastAttemptAt: now,
    },
  });

  await db.auditEvent.create({
    data: {
      batchId: debtor.batchId,
      debtorId: debtor.id,
      actor: "operator@console",
      action: "ATTEMPT_RECORDED",
      detail: `${channel} · ${outcome}${amountCollected > 0 ? ` · ₹${amountCollected} collected` : ""} for ${token}.`,
    },
  });

  return NextResponse.json({
    ok: true,
    attempt: {
      id: attempt.id,
      channel: attempt.channel,
      escalationLevel: attempt.escalationLevel,
      outcome: attempt.outcome,
      amountCollected: round0(attempt.amountCollected),
      transcriptSnippet: attempt.transcriptSnippet,
      attemptedAt: attempt.attemptedAt,
    },
    debtor: {
      token: updated.token,
      recoveredAmount: round0(updated.recoveredAmount),
      attemptCountTotal: updated.attemptCountTotal,
    },
  });
}
