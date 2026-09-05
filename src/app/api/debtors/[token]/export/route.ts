import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/debtors/[token]/export
// Returns a per-debtor compliance CSV: attempts + opt-outs + audit events.
// Used by the debtor drill-down drawer for compliance reporting.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const debtor = await db.debtor.findUnique({
    where: { token },
    include: { batch: { select: { name: true } } },
  });
  if (!debtor) {
    return NextResponse.json({ error: "Debtor not found" }, { status: 404 });
  }

  const [attempts, optOuts, audit] = await Promise.all([
    db.recoveryAttempt.findMany({
      where: { debtorId: debtor.id },
      orderBy: { attemptedAt: "desc" },
    }),
    db.optOutRecord.findMany({
      where: { debtorId: debtor.id },
      orderBy: { detectedAt: "desc" },
    }),
    db.auditEvent.findMany({
      where: { debtorId: debtor.id },
      orderBy: { at: "desc" },
    }),
  ]);

  const ist = (d: Date) =>
    new Date(d.getTime() + 5.5 * 60 * 60 * 1000)
      .toISOString()
      .replace("T", " ")
      .slice(0, 19) + " IST";

  const esc = (v: string | null | undefined) =>
    `"${(v ?? "").replace(/"/g, '""')}"`;

  const lines: string[] = [];

  // Header: debtor summary
  lines.push("# Debtor summary");
  lines.push(`token,${esc(debtor.token)}`);
  lines.push(`batch,${esc(debtor.batch.name)}`);
  lines.push(`region,${esc(debtor.region)}`);
  lines.push(`preferred_language,${esc(debtor.preferredLanguage)}`);
  lines.push(`outstanding_amount,${debtor.outstandingAmount}`);
  lines.push(`recovered_amount,${debtor.recoveredAmount}`);
  lines.push(`is_holdout,${debtor.isHoldout}`);
  lines.push(`opt_out,${debtor.optOut}`);
  lines.push(`opt_out_reason,${esc(debtor.optOutReason)}`);
  lines.push(`current_level,${debtor.currentLevel}`);
  lines.push(`attempt_count_total,${debtor.attemptCountTotal}`);
  lines.push("");

  // Attempts section
  lines.push("# Attempts");
  lines.push("timestamp_ist,channel,escalation_level,outcome,amount_collected,transcript_snippet");
  for (const a of attempts) {
    lines.push(
      [
        ist(a.attemptedAt),
        esc(a.channel),
        a.escalationLevel,
        esc(a.outcome),
        a.amountCollected,
        esc(a.transcriptSnippet),
      ].join(","),
    );
  }
  lines.push("");

  // Opt-outs section
  lines.push("# Opt-out records");
  lines.push("timestamp_ist,source,reason,language,raw_phrase");
  for (const o of optOuts) {
    lines.push(
      [
        ist(o.detectedAt),
        esc(o.source),
        esc(o.reason),
        esc(o.language),
        esc(o.rawPhrase),
      ].join(","),
    );
  }
  lines.push("");

  // Audit section
  lines.push("# Audit events");
  lines.push("timestamp_ist,actor,action,detail");
  for (const e of audit) {
    lines.push(
      [ist(e.at), esc(e.actor), esc(e.action), esc(e.detail)].join(","),
    );
  }

  const csv = lines.join("\r\n");
  const stamp = new Date()
    .toISOString()
    .replace(/[:T]/g, "-")
    .slice(0, 19);
  const filename = `debtor-${token}-${stamp}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
