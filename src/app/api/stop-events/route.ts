import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/stop-events?limit=20
export async function GET(req: NextRequest) {
  const limit = Math.min(
    100,
    Number(req.nextUrl.searchParams.get("limit") || "20"),
  );

  const events = await db.stopRuleEvent.findMany({
    orderBy: { at: "desc" },
    take: limit,
    include: { debtor: { select: { token: true } } },
  });

  return NextResponse.json(
    events.map((e) => ({
      id: e.id,
      debtorToken: e.debtor.token,
      rawPhrase: e.rawPhrase,
      detectedLanguage: e.detectedLanguage,
      matchedRule: e.matchedRule,
      actionTaken: e.actionTaken,
      confidence: e.confidence,
      at: e.at,
    })),
  );
}
