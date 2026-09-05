import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/escalation-gates/:id/approve
// Human approval gate: promotes a debtor up the mandate-gated escalation
// ladder. Writes an audit event for compliance evidence.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const gate = await db.escalationGate.findUnique({
    where: { id },
    include: { debtor: true, batch: true },
  });
  if (!gate) {
    return NextResponse.json({ error: "Gate not found" }, { status: 404 });
  }
  if (gate.status !== "PENDING") {
    return NextResponse.json(
      { error: `Gate already ${gate.status}` },
      { status: 409 },
    );
  }

  const updated = await db.escalationGate.update({
    where: { id },
    data: {
      status: "APPROVED",
      approver: "operator@console",
      decidedAt: new Date(),
    },
    include: { debtor: { select: { token: true } } },
  });

  // Promote debtor up the ladder
  await db.debtor.update({
    where: { id: gate.debtorId },
    data: { currentLevel: gate.toLevel },
  });

  await db.auditEvent.create({
    data: {
      batchId: gate.batchId,
      debtorId: gate.debtorId,
      actor: "operator@console",
      action: "ESCALATION_APPROVED",
      detail: `Rung ${gate.fromLevel} → ${gate.toLevel} for ${gate.debtor.token}`,
    },
  });

  return NextResponse.json({
    ok: true as const,
    gate: {
      id: updated.id,
      debtorToken: updated.debtor.token,
      fromLevel: updated.fromLevel,
      toLevel: updated.toLevel,
      rationale: updated.rationale ?? "",
      requestedAt: updated.requestedAt,
      status: updated.status as "PENDING" | "APPROVED" | "REJECTED",
    },
  });
}
