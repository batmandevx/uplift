"use client";

import * as React from "react";

// Animated number counter that eases from 0 → target on mount and whenever
// the target changes. Uses requestAnimationFrame with an ease-out cubic curve.
// Renders tabular-nums so digits don't jiggle while counting.
export function useAnimatedNumber(target: number, duration = 900) {
  const [display, setDisplay] = React.useState(0);
  const ref = React.useRef<number>(0);
  const rafRef = React.useRef<number | null>(null);
  const startRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    const from = ref.current;
    const delta = target - from;
    if (delta === 0) return;
    startRef.current = null;

    function tick(now: number) {
      if (startRef.current === null) startRef.current = now;
      const elapsed = now - startRef.current;
      const t = Math.min(1, elapsed / duration);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      const next = from + delta * eased;
      ref.current = next;
      setDisplay(next);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        ref.current = target;
        setDisplay(target);
      }
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return display;
}
