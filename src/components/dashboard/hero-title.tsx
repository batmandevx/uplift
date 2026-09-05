"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Radio } from "lucide-react";

/**
 * Animated hero title with a typing-style reveal and a flowing gradient.
 * Purely presentational — text content is fixed, so no a11y surprises.
 */
export function HeroTitle() {
  const line1 = "The agent that";
  const line2 = "proves every rupee.";

  return (
    <div className="flex flex-col gap-2.5">
      <div className="inline-flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-500 sm:text-xs">
        <span className="relative inline-flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
        </span>
        <motion.span
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          Track 03 · Verifiable Revenue Recovery Command Center
        </motion.span>
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[9px] text-emerald-600 inline-flex dark:text-emerald-300"
        >
          <Radio className="size-2.5" aria-hidden />
          LIVE RADAR
        </motion.span>
      </div>

      <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
        <span className="text-foreground">Uplift:&nbsp;</span>
        <TypingLine text={line1} delay={0.1} />
        <br />
        <motion.span
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent gradient-animated inline-block pr-1 pb-1"
        >
          {line2}
        </motion.span>
      </h1>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.5 }}
        className="max-w-3xl text-sm leading-relaxed text-muted-foreground/90 font-medium"
      >
        <span className="text-foreground font-semibold">Half of failed payments recover on their own.</span> Merchants can&apos;t tell which half. Uplift proves it with pre-registered holdouts, degradation-aware pacing, and cryptographic Saboot receipts.
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-muted-foreground"
      >
        <span className="rounded-md border border-emerald-500/20 bg-emerald-500/5 px-2 py-0.5 text-emerald-400 font-mono text-[10px]">
          [DETECT] Degradation-aware pacing
        </span>
        <span className="rounded-md border border-amber-500/20 bg-amber-500/5 px-2 py-0.5 text-amber-400 font-mono text-[10px]">
          [INTERVENE] Bounded ladder
        </span>
        <span className="rounded-md border border-cyan-500/20 bg-cyan-500/5 px-2 py-0.5 text-cyan-400 font-mono text-[10px]">
          [PROVE] Causal measurement
        </span>
        <span className="rounded-md border border-purple-500/20 bg-purple-500/5 px-2 py-0.5 text-purple-400 font-mono text-[10px]">
          [GUARDRAIL] No LLM in money path
        </span>
      </motion.div>
    </div>
  );
}

function TypingLine({ text, delay }: { text: string; delay: number }) {
  const words = text.split(" ");
  return (
    <span className="inline">
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: delay + i * 0.08,
            duration: 0.35,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="inline-block"
        >
          {word}
          {i < words.length - 1 ? "\u00A0" : ""}
        </motion.span>
      ))}
    </span>
  );
}

/**
 * Subtle "scan line" shimmer strip shown directly under the hero, implying
 * the system is continuously sweeping for compliance events.
 */
export function HeroScanline() {
  return (
    <motion.div
      aria-hidden
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ delay: 0.7, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="relative h-px w-full origin-left overflow-hidden bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"
    >
      <motion.div
        className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-emerald-300/80 to-transparent"
        animate={{ x: ["-100%", "300%"] }}
        transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
      />
    </motion.div>
  );
}

/** Tiny pulsing "system heartbeat" used next to section labels. */
export function LivePulse({ label }: { label: string }) {
  const [beats, setBeats] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setBeats((b) => b + 1), 2000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
      <Activity className="size-3 text-emerald-500" aria-hidden />
      <AnimatePresence mode="popLayout">
        <motion.span
          key={beats % 3}
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -3 }}
          className="tabular-nums"
        >
          {label}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
