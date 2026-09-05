"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  PhoneOff,
  Sun,
  Moon,
  Layers,
  Download,
  Keyboard,
  type LucideIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type DockItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  kbd?: string;
  run: () => void;
};

/**
 * Floating, Mac-style quick-actions dock pinned to the bottom-center.
 * Each icon scales and lifts on hover, and every action fires instantly.
 * Hidden on small screens to preserve mobile real estate.
 */
export function QuickActionsDock() {
  const { resolvedTheme, setTheme } = useTheme();
  const [hovered, setHovered] = React.useState<string | null>(null);

  const items: DockItem[] = [
    {
      id: "stop",
      label: "Focus stop-rule simulator",
      icon: PhoneOff,
      kbd: "S",
      run: () => {
        const section = document.querySelector(
          'section[aria-label="Pillar 3 — Stopping rules"]',
        ) as HTMLElement | null;
        section?.scrollIntoView({ behavior: "smooth", block: "start" });
        const inp = document.querySelector(
          'input[aria-label="Stop phrase"]',
        ) as HTMLInputElement | null;
        setTimeout(() => inp?.focus(), 450);
      },
    },
    {
      id: "batch",
      label: "Jump to batch comparison",
      icon: Layers,
      run: () => {
        document
          .querySelector(
            'section[aria-label="Batch comparison and audit timeline"]',
          )
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      },
    },
    {
      id: "export",
      label: "Export audit CSV",
      icon: Download,
      run: async () => {
        try {
          const res = await fetch("/api/audit/export?limit=500");
          if (!res.ok) throw new Error("Export failed");
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download =
            res.headers
              .get("Content-Disposition")
              ?.match(/filename="([^"]+)"/)?.[1] ?? "audit-export.csv";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          toast.success("Audit CSV exported");
        } catch (e) {
          toast.error("Export failed", { description: (e as Error).message });
        }
      },
    },
    {
      id: "theme",
      label:
        resolvedTheme === "dark" ? "Switch to light theme" : "Switch to dark theme",
      icon: resolvedTheme === "dark" ? Sun : Moon,
      kbd: "T",
      run: () => {
        const next = resolvedTheme === "dark" ? "light" : "dark";
        setTheme(next);
        toast.success(`Switched to ${next} theme`);
      },
    },
    {
      id: "help",
      label: "Keyboard shortcuts",
      icon: Keyboard,
      kbd: "?",
      run: () => {
        toast.info("Keyboard shortcuts", {
          description:
            "S — focus stop-rule · T — toggle theme · B — batch selector · Cmd+K — command palette · ? — this help",
        });
      },
    },
  ];

  return (
    <motion.nav
      aria-label="Quick actions"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="fixed bottom-4 left-1/2 z-40 hidden -translate-x-1/2 md:block"
    >
      <div className="glass flex items-end gap-1 rounded-2xl border px-2.5 pb-2 pt-1.5 shadow-lg shadow-black/5">
        {items.map((item) => {
          const Icon = item.icon;
          const active = hovered === item.id;
          return (
            <motion.button
              key={item.id}
              type="button"
              onClick={item.run}
              onMouseEnter={() => setHovered(item.id)}
              onMouseLeave={() => setHovered(null)}
              whileHover={{ y: -6, scale: 1.12 }}
              whileTap={{ scale: 0.92 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className={cn(
                "group relative grid size-10 place-items-center rounded-xl text-muted-foreground transition-colors",
                active && "bg-accent text-foreground",
              )}
              aria-label={item.label}
            >
              <Icon className="size-4.5" aria-hidden />

              {/* Tooltip */}
              <span
                className={cn(
                  "pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border bg-popover px-2 py-1 text-[10px] font-medium text-popover-foreground shadow-md transition-all duration-200",
                  active
                    ? "translate-y-0 opacity-100"
                    : "translate-y-1 opacity-0",
                )}
                role="tooltip"
              >
                {item.label}
                {item.kbd && (
                  <kbd className="ml-1.5 rounded border bg-muted/60 px-1 font-mono text-[9px]">
                    {item.kbd}
                  </kbd>
                )}
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.nav>
  );
}
