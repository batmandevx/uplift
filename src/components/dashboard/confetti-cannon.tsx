"use client";

import * as React from "react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  shape: "rect" | "circle";
  life: number;
  decay: number;
};

const PALETTE = [
  "#10b981", // emerald
  "#14b8a6", // teal
  "#22d3ee", // cyan
  "#f59e0b", // amber
  "#fbbf24", // yellow
  "#a78bfa", // violet
  "#f472b6", // pink
];

let rafId = 0;

/**
 * Lightweight, dependency-free canvas confetti. Fires from the bottom
 * center with a spread of colored rectangles and circles, then cleans up
 * after itself. Used to celebrate the "Seal batch" milestone.
 */
export function fireConfetti(opts?: { particleCount?: number }) {
  if (typeof window === "undefined") return;
  const count = opts?.particleCount ?? 160;

  // Reuse an existing canvas if a burst is already in flight.
  let canvas = document.getElementById(
    "confetti-canvas",
  ) as HTMLCanvasElement | null;
  if (canvas) cancelAnimationFrame(rafId);
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.id = "confetti-canvas";
    canvas.style.cssText =
      "position:fixed;inset:0;pointer-events:none;z-index:9999;";
    document.body.appendChild(canvas);
  }

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.scale(dpr, dpr);

  const particles: Particle[] = [];
  const originX = window.innerWidth / 2;
  const originY = window.innerHeight * 0.65;

  for (let i = 0; i < count; i++) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * (Math.PI * 0.9);
    const speed = 9 + Math.random() * 8;
    particles.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 5 + Math.random() * 6,
      color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.25,
      shape: Math.random() > 0.35 ? "rect" : "circle",
      life: 1,
      decay: 0.006 + Math.random() * 0.008,
    });
  }

  let frame = 0;
  function tick() {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    let alive = false;
    for (const p of particles) {
      if (p.life <= 0) continue;
      alive = true;
      p.vy += 0.22; // gravity
      p.vx *= 0.99; // drag
      p.vy *= 0.995;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;
      p.life -= p.decay;

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      if (p.shape === "rect") {
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    frame++;
    if (alive && frame < 400) {
      rafId = requestAnimationFrame(tick);
    } else {
      canvas.remove();
    }
  }
  rafId = requestAnimationFrame(tick);
}
