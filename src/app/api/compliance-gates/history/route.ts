import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/compliance-gates/history?batchId=&hours=24
// Returns the last N hours of compliance-gate states per gate, used by the
// sparkline in the compliance-gate banner. Each gate gets an array of
// { at, state } points ordered oldest → newest.
export async function GET(req: NextRequest) {
  const batchId = req.nextUrl.searchParams.get("batchId");
  if (!batchId) {
    return NextResponse.json({ error: "Missing batchId" }, { status: 400 });
  }
  const hours = Math.min(
    72,
    Math.max(1, Number(req.nextUrl.searchParams.get("hours") || "24")),
  );

  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  const snaps = await db.complianceGateSnapshot.findMany({
    where: { batchId, at: { gte: since } },
    orderBy: { at: "asc" },
    select: { gateKey: true, state: true, at: true },
  });

  // Group by gateKey
  const byGate = new Map<string, { at: string; state: string }[]>();
  for (const s of snaps) {
    const arr = byGate.get(s.gateKey) ?? [];
    arr.push({ at: s.at.toISOString(), state: s.state });
    byGate.set(s.gateKey, arr);
  }

  return NextResponse.json({
    hours,
    gates: Array.from(byGate.entries()).map(([key, points]) => ({
      gateKey: key,
      points,
    })),
  });
}
