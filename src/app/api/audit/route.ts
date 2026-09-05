import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/audit?limit=50
export async function GET(req: NextRequest) {
  const limit = Math.min(
    200,
    Number(req.nextUrl.searchParams.get("limit") || "50"),
  );

  const events = await db.auditEvent.findMany({
    orderBy: { at: "desc" },
    take: limit,
  });

  return NextResponse.json(
    events.map((e) => ({
      id: e.id,
      at: e.at,
      actor: e.actor,
      action: e.action,
      detail: e.detail ?? undefined,
    })),
  );
}
