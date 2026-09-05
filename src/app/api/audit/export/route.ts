import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/audit/export?limit=500
// Returns the audit timeline as a CSV file for compliance reporting.
// Columns: timestamp_ist, batch_name, actor, action, detail
export async function GET(req: NextRequest) {
  const limit = Math.min(
    2000,
    Math.max(1, Number(req.nextUrl.searchParams.get("limit") || "500")),
  );

  const events = await db.auditEvent.findMany({
    orderBy: { at: "desc" },
    take: limit,
    include: { batch: { select: { name: true } } },
  });

  const header = ["timestamp_ist", "batch_name", "actor", "action", "detail"];
  const rows = events.map((e) => {
    const ist = new Date(e.at.getTime() + 5.5 * 60 * 60 * 1000);
    const ts = ist.toISOString().replace("T", " ").slice(0, 19) + " IST";
    return [
      ts,
      e.batch?.name ?? "",
      e.actor,
      e.action,
      (e.detail ?? "").replace(/"/g, '""'),
    ]
      .map((v) => `"${v}"`)
      .join(",");
  });
  const csv = [header.join(","), ...rows].join("\r\n");

  const stamp = new Date()
    .toISOString()
    .replace(/[:T]/g, "-")
    .slice(0, 19);
  const filename = `audit-export-${stamp}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
