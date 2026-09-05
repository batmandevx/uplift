"use client";

import * as React from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { cn } from "@/lib/utils";

type SpotlightContextValue = {
  x: MotionValue<number>;
  y: MotionValue<number>;
};

const SpotlightContext = React.createContext<SpotlightContextValue | null>(
  null,
);

/**
 * Reusable wrapper that gives any card a premium, tactile feel:
 *  - a mouse-tracking radial "spotlight" glow that follows the cursor
 *  - a subtle 3D tilt on hover
 *  - an optional permanent top accent gradient
 *
 * Children read the cursor position via `SpotlightContext`, so multiple
 * inner elements can share the same glow origin.
 */
export function SpotlightCard({
  children,
  className,
  glowClassName,
  accent = "none",
  tilt = true,
  as = "div",
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  /** Extra classes merged onto the spotlight glow layer. */
  glowClassName?: string;
  /** Permanent gradient accent bar along the top edge. */
  accent?: "none" | "emerald" | "amber" | "rose" | "violet";
  /** Disable the 3D tilt (keeps the spotlight glow). */
  tilt?: boolean;
  as?: "div" | "article" | "section" | "li";
} & Omit<React.ComponentProps<"div">, "children">) {
  const ref = React.useRef<HTMLDivElement>(null);
  const rawX = useMotionValue(0.5);
  const rawY = useMotionValue(0.5);
  const x = useSpring(rawX, { stiffness: 180, damping: 22, mass: 0.4 });
  const y = useSpring(rawY, { stiffness: 180, damping: 22, mass: 0.4 });

  const rotateX = useTransform(y, [0, 1], [tilt ? 4 : 0, tilt ? -4 : 0]);
  const rotateY = useTransform(x, [0, 1], [tilt ? -4 : 0, tilt ? 4 : 0]);
  const glowX = useTransform(x, (v) => `${v * 100}%`);
  const glowY = useTransform(y, (v) => `${v * 100}%`);

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    rawX.set((e.clientX - rect.left) / rect.width);
    rawY.set((e.clientY - rect.top) / rect.height);
  }

  function onPointerLeave() {
    rawX.set(0.5);
    rawY.set(0.5);
  }

  const context = React.useMemo(() => ({ x, y }), [x, y]);

  const accentGrad: Record<Exclude<typeof accent, "none">, string> = {
    emerald: "from-emerald-500 via-teal-400 to-transparent",
    amber: "from-amber-500 via-yellow-400 to-transparent",
    rose: "from-rose-500 via-pink-400 to-transparent",
    violet: "from-violet-500 via-fuchsia-400 to-transparent",
  };

  const MotionTag = motion[as] as typeof motion.div;

  return (
    <MotionTag
      ref={ref}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className={cn("group relative h-full", className)}
      {...(props as React.ComponentProps<typeof motion.div>)}
    >
      <SpotlightContext.Provider value={context}>
        {/* Mouse-tracking glow */}
        <motion.div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[inherit]",
            glowClassName,
          )}
        >
          <motion.div
            className="absolute size-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{
              left: glowX,
              top: glowY,
              background:
                "radial-gradient(circle, color-mix(in oklch, var(--chart-2) 16%, transparent) 0%, transparent 65%)",
            }}
          />
        </motion.div>

        {/* Permanent accent bar */}
        {accent !== "none" && (
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-x-0 top-0 z-10 h-[2px] rounded-[inherit] border-b-0 bg-gradient-to-r opacity-75 transition-opacity duration-300 group-hover:opacity-100",
              accentGrad[accent],
            )}
          />
        )}

        <div className="relative z-[1] h-full">{children}</div>
      </SpotlightContext.Provider>
    </MotionTag>
  );
}
