"use client";

import { AlertCircle, RotateCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function QueryError({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <Alert variant="destructive" role="alert">
      <AlertCircle className="size-4" aria-hidden />
      <AlertTitle>Failed to load</AlertTitle>
      <AlertDescription>
        <p>
          {message ??
            "We couldn't reach this endpoint yet. It may still be loading on the backend."}
        </p>
        {onRetry && (
          <Button
            size="sm"
            variant="outline"
            className="mt-2 h-7 gap-1 text-xs"
            onClick={onRetry}
          >
            <RotateCw className="size-3" aria-hidden /> Retry
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
