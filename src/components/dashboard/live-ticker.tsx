"use client";

import * as React from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  PhoneCall,
  Gavel,
  XCircle,
  Cpu,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useAudit } from "./queries";
import type { AuditEvent } from "@/lib/dashboard-types";
import { formatDateTime } from "@/lib/format";

const ICONS: Record<string, LucideIcon> = {
  BATCH_STARTED: Cpu,
  BATCH_SEALED: Lock,
  ESCALATION_APPROVED: ShieldCheck,
  ESCALATION_REJECTED: XCircle,
  STOP_RULE_TRIGGERED: ShieldAlert,
  STOP_PHRASE_NOT_MATCHED: PhoneCall,
};

const TONE: Record<string, string> = {
  BATCH_STARTED: "text-muted-foreground",
  BATCH_SEALED: "text-amber-500",
  ESCALATION_APPROVED: "text-emerald-500",
  ESCALATION_REJECTED: "text-rose-500",
  STOP_RULE_TRIGGERED: "text-rose-500",
  STOP_PHRASE_NOT_MATCHED: "text-muted-foreground",
};

function shortDetail(detail: string | null, max = 48): string {
  if (!detail) return "";
  return detail.length > max ? `${detail.slice(0, max)}…` : detail;
}

function TickerItem({ event }: { event: AuditEvent }) {
  const Icon = ICONS[event.action] ?? Zap;
  return (
    <span className="inline-flex shrink-0 items-center gap-2 px-5 text-[11px]">
      <Icon className={`size-3.5 shrink-0 ${TONE[event.action] ?? "text-muted-foreground"}`} aria-hidden />
      <span className="font-medium text-foreground/90">
        {event.action.replace(/_/g, " ")}
      </span>
      {event.detail && (
        <span className="max-w-[220px] truncate text-muted-foreground">
          {shortDetail(event.detail)}
        </span>
      )}
      <span className="tabular-nums text-muted-foreground/70">
        {formatDateTime(event.at)}
      </span>
      <span className="ml-3 size-1 rounded-full bg-border" aria-hidden />
    </span>
  );
}

/**
 * Live operations marquee. Polls the audit feed and loops the most recent
 * events across the hero in a seamless ticker — gives the dashboard a
 * convincing "mission control" heartbeat.
 */
export function LiveOpsTicker() {
  const { data, isLoading } = useAudit(12);

  if (isLoading || !data || data.length === 0) {
    return (
      <div className="flex h-9 items-center overflow-hidden rounded-lg border bg-card/50 px-4 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" aria-hidden />
          Listening for compliance events…
        </span>
      </div>
    );
  }

  // Duplicate the track so the -50% loop is seamless.
  const track = [...data, ...data];

  return (
    <div
      className="marquee-paused group relative flex h-9 items-center overflow-hidden rounded-lg border bg-card/50"
      aria-label="Live compliance event ticker"
      role="marquee"
    >
      {/* Edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-background to-transparent" aria-hidden />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-background to-transparent" aria-hidden />

      <div className="marquee-track items-center" style={{ ["--marquee-duration" as string]: `${Math.max(24, data.length * 6)}s` }}>
        {track.map((e, i) => (
          <TickerItem key={`${e.id}-${i}`} event={e} />
        ))}
      </div>

      {/* Live badge */}
      <div className="absolute right-2 z-20 inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-background/90 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-emerald-600 backdrop-blur dark:text-emerald-300">
        <span className="size-1 animate-pulse rounded-full bg-emerald-500" aria-hidden />
        Live
      </div>
    </div>
  );
}
