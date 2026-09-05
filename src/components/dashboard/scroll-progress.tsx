"use client";

import * as React from "react";
import { motion, useScroll, useSpring } from "framer-motion";

/**
 * Slim animated progress bar pinned to the very top of the viewport.
 * Fills left→right as the operator scrolls the dashboard, with a subtle
 * stripe texture so it reads as "activity" rather than a static border.
 */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 24,
    restDelta: 0.001,
  });

  return (
    <motion.div
      aria-hidden
      className="fixed inset-x-0 top-0 z-50 h-[3px] origin-left bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400"
      style={{ scaleX }}
    >
      <div className="h-full w-full opacity-25 progress-stripes" />
    </motion.div>
  );
}
