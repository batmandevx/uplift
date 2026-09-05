"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useBatches } from "./queries";
import type { Batch, BatchStatus } from "@/lib/dashboard-types";

const statusVariant: Record<BatchStatus, string> = {
  RUNNING: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300/40",
  SEALED: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300/40",
  DRAFT: "bg-muted text-muted-foreground border-border",
  CLOSED: "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300/40",
};

export function BatchSelector({
  value,
  onChange,
}: {
  value: string | undefined;
  onChange: (id: string) => void;
}) {
  const { data, isLoading, error } = useBatches();

  if (error) {
    return (
      <div className="text-xs text-destructive" role="alert">
        Failed to load batches
      </div>
    );
  }

  return (
    <Select
      value={value ?? ""}
      onValueChange={onChange}
      disabled={isLoading || !data}
    >
      <SelectTrigger
        id="batch-selector-trigger"
        className="w-[240px] sm:w-[300px]"
        aria-label="Select batch"
      >
        <SelectValue
          placeholder={isLoading ? "Loading batches…" : "Select batch"}
        />
      </SelectTrigger>
      <SelectContent>
        {data?.map((b: Batch) => (
          <SelectItem key={b.id} value={b.id}>
            <span className="flex items-center gap-2">
              <span className="max-w-[180px] truncate">{b.name}</span>
              <Badge
                variant="outline"
                className={`ml-1 shrink-0 whitespace-nowrap ${statusVariant[b.status]}`}
              >
                {b.status}
              </Badge>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
