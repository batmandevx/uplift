import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/debtors/[token]/opt-out
// Body: { reason?, rawPhrase?, language? }
//
// Manually opt-out a debtor from outreach. Writes an immutable OptOutRecord
// + AuditEvent, sets debtor.optOut = true. Used by the operator to record
// stop requests received out-of-band (e.g. via email or postal letter).
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const body = await req.json().catch(() => ({})) as {
    reason?: string;
    rawPhrase?: string;
    language?: string;
  };

  const debtor = await db.debtor.findUnique({
    where: { token },
    include: { batch: true },
  });
  if (!debtor) {
    return NextResponse.json({ error: "Debtor not found" }, { status: 404 });
  }

  if (debtor.optOut) {
    return NextResponse.json(
      { error: "Debtor already opted-out.", alreadyOptedOut: true },
      { status: 409 },
    );
  }

  const reason = body.reason || "MANUAL_OPERATOR_OPTOUT";
  const rawPhrase = body.rawPhrase ?? null;
  const language = body.language || "en";

  const [optOutRecord] = await db.$transaction([
    db.optOutRecord.create({
      data: {
        debtorId: debtor.id,
        source: "AGENT",
        reason,
        rawPhrase,
        language,
      },
    }),
    db.debtor.update({
      where: { id: debtor.id },
      data: {
        optOut: true,
        optOutReason: reason,
        stoppedReason: "MANUAL_OPTOUT",
      },
    }),
    db.auditEvent.create({
      data: {
        batchId: debtor.batchId,
        debtorId: debtor.id,
        actor: "operator@console",
        action: "MANUAL_OPTOUT",
        detail: `Debtor ${token} manually opted-out. Reason: ${reason}.`,
      },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    optOutRecord: {
      id: optOutRecord.id,
      debtorToken: token,
      reason: optOutRecord.reason,
      rawPhrase: optOutRecord.rawPhrase,
      language: optOutRecord.language,
      detectedAt: optOutRecord.detectedAt,
    },
    debtor: {
      token,
      optOut: true,
      optOutReason: reason,
    },
  });
}
