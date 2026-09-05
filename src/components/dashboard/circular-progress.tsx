"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Animated SVG ring that fills to `value` (0–100) with a soft gradient
 * stroke and an optional center label. Used for holdout ratio, compliance
 * score, and other "fill the gauge" moments.
 */
export function CircularProgress({
  value,
  size = 72,
  strokeWidth = 6,
  className,
  trackClassName,
  gradientId = "ring-grad",
  from = "var(--chart-1)",
  to = "var(--chart-2)",
  label,
  sublabel,
  showValue = true,
  delay = 0.4,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  trackClassName?: string;
  gradientId?: string;
  from?: string;
  to?: string;
  label?: React.ReactNode;
  sublabel?: React.ReactNode;
  showValue?: boolean;
  delay?: number;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const target = circumference * (1 - clamped / 100);

  return (
    <div
      className={cn("relative inline-grid place-items-center", className)}
      role="img"
      aria-label={`${Math.round(clamped)}%`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={strokeWidth}
          className={cn("stroke-muted/70", trackClassName)}
        />
        {/* Animated fill */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: target }}
          transition={{
            duration: 1.1,
            delay,
            ease: [0.22, 1, 0.36, 1],
          }}
        />
      </svg>
      {showValue && (
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <div className="text-sm font-bold tabular-nums leading-none">
              {label ?? `${Math.round(clamped)}%`}
            </div>
            {sublabel && (
              <div className="mt-0.5 text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
                {sublabel}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
