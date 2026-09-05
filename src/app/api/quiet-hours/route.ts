import { NextResponse } from "next/server";
import { QUIET_HOURS } from "@/lib/recovery-stats";

// GET /api/quiet-hours
// Returns whether the current IST time falls inside the configured quiet-hours
// window (21:00–08:00 IST). Outreach must be suppressed while inside.
//
// We compute IST by taking the UTC minutes-since-midnight and shifting by
// +5:30, so this works in any server timezone.
export async function GET() {
  const now = new Date();
  // IST = UTC + 5:30
  const istMs = now.getTime() + (5 * 60 + 30) * 60 * 1000;
  const ist = new Date(istMs);
  const istMinutes = ist.getUTCHours() * 60 + ist.getUTCMinutes();

  const [sh, sm] = QUIET_HOURS.start.split(":").map(Number);
  const [eh, em] = QUIET_HOURS.end.split(":").map(Number);
  const startMin = sh * 60 + sm; // 21:00 = 1260
  const endMin = eh * 60 + em; // 08:00 = 480

  // Window wraps midnight (21:00 → 08:00)
  const inside =
    istMinutes >= startMin || istMinutes < endMin;

  // Minutes until the window flips.
  let nextChangeInMinutes: number;
  if (inside) {
    // currently inside; next change is leaving the window at endMin (08:00)
    nextChangeInMinutes =
      istMinutes < endMin
        ? endMin - istMinutes
        : 24 * 60 - istMinutes + endMin;
  } else {
    // currently outside; next change is entering at startMin (21:00)
    nextChangeInMinutes =
      istMinutes < startMin
        ? startMin - istMinutes
        : 24 * 60 - istMinutes + startMin;
  }

  const hh = String(ist.getUTCHours()).padStart(2, "0");
  const mm = String(ist.getUTCMinutes()).padStart(2, "0");

  return NextResponse.json({
    nowIst: `${hh}:${mm}`,
    insideQuietHours: inside,
    windowStart: QUIET_HOURS.start,
    windowEnd: QUIET_HOURS.end,
    nextChangeInMinutes,
    outreachSuppressed: inside,
  });
}
