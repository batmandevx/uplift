import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/escalation-gates/:id/reject
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const gate = await db.escalationGate.findUnique({
    where: { id },
    include: { debtor: { select: { token: true } } },
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
      status: "REJECTED",
      approver: "operator@console",
      decidedAt: new Date(),
    },
    include: { debtor: { select: { token: true } } },
  });

  await db.auditEvent.create({
    data: {
      batchId: gate.batchId,
      debtorId: gate.debtorId,
      actor: "operator@console",
      action: "ESCALATION_REJECTED",
      detail: `Rung ${gate.fromLevel} → ${gate.toLevel} rejected for ${gate.debtor.token}`,
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
