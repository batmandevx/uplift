"use client";

import * as React from "react";
import { motion, useInView, type Variants } from "framer-motion";

// Reveal-on-scroll wrapper. Children fade + rise into view the first time the
// element enters the viewport. Used to give the dashboard a polished, staged
// entrance without jank.
export function Reveal({
  children,
  delay = 0,
  y = 16,
  scale = 1,
  spring = false,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  /** Initial scale when hidden (1 = no scale). Slight undershoot adds pop. */
  scale?: number;
  /** Use a bouncy spring transition instead of a smooth ease-out. */
  spring?: boolean;
  className?: string;
  as?: "div" | "section" | "li" | "article";
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px 0px" });

  const MotionTag = motion[as] as typeof motion.div;

  return (
    <MotionTag
      ref={ref}
      initial={{ opacity: 0, y, scale }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y, scale }}
      transition={
        spring
          ? { type: "spring", stiffness: 120, damping: 16, delay }
          : { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }
      }
      className={className}
    >
      {children}
    </MotionTag>
  );
}

// Stagger container + item variants for lists.
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
};
