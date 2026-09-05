"use client";

import { ShieldCheck, MapPin } from "lucide-react";
import { BatchSelector } from "./batch-selector";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import type { Batch } from "@/lib/dashboard-types";

export function SiteHeader({
  batch,
  batchId,
  onBatchChange,
}: {
  batch?: Batch;
  batchId?: string;
  onBatchChange: (id: string) => void;
}) {
  return (
    <header
      className="sticky top-0 z-40 w-full border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70"
      role="banner"
    >
      <div className="mx-auto flex max-w-[1400px] flex-col gap-3 px-4 py-3 sm:px-6 md:flex-row md:items-center md:justify-between md:gap-4">
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-md bg-primary text-primary-foreground shadow-sm">
            <ShieldCheck className="size-5" aria-hidden />
          </div>
          <div className="leading-tight">
            <h1 className="text-sm font-semibold tracking-tight sm:text-base">
              SealedRecovery
            </h1>
            <p className="text-[11px] text-muted-foreground sm:text-xs">
              Compliant Collections Ops
            </p>
          </div>
          {batch?.region && (
            <Badge variant="outline" className="ml-1 hidden gap-1 sm:inline-flex">
              <MapPin className="size-3" aria-hidden />
              {batch.region}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <BatchSelector value={batchId} onChange={onBatchChange} />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
