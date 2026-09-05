"use client";

import * as React from "react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Moon,
  Sun,
  ScrollText,
  FlaskConical,
  PhoneOff,
  GitCompareArrows,
  Users,
  TrendingUp,
  Download,
  Keyboard,
  type LucideIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";

interface CommandEntry {
  id: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
  group: string;
  keywords?: string;
  run: () => void;
}

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  // Open on Cmd+K / Ctrl+K
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const scrollToSection = React.useCallback((selector: string, label: string) => {
    const el = document.querySelector(selector) as HTMLElement | null;
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      // brief flash highlight
      el.style.transition = "box-shadow 0.4s ease";
      el.style.boxShadow = "0 0 0 2px var(--ring)";
      setTimeout(() => {
        el.style.boxShadow = "";
      }, 1200);
    }
    setOpen(false);
    toast.success(`Jumped to ${label}`);
  }, []);

  const entries: CommandEntry[] = [
    // Navigation
    {
      id: "nav-methodology",
      label: "Methodology Pre-registration",
      hint: "Pillar 1",
      icon: FlaskConical,
      group: "Navigate",
      keywords: "holdout hash plan pre-register",
      run: () =>
        scrollToSection(
          'section[aria-label="Pillar 1 — Measured money recovered"]',
          "Methodology",
        ),
    },
    {
      id: "nav-stop-rule",
      label: "Stop-Rule Simulator",
      hint: "Pillar 3",
      icon: PhoneOff,
      group: "Navigate",
      keywords: "hinglish stop phrase halt outreach",
      run: () =>
        scrollToSection(
          'section[aria-label="Pillar 3 — Stopping rules"]',
          "Stop-Rule Simulator",
        ),
    },
    {
      id: "nav-escalation",
      label: "Escalation Ladder",
      hint: "Pillar 2",
      icon: Users,
      group: "Navigate",
      keywords: "rung ladder gate approve",
      run: () =>
        scrollToSection(
          'aside[aria-label="Pillar 2 — Compliant escalation rail"]',
          "Escalation Ladder",
        ),
    },
    {
      id: "nav-batch-comparison",
      label: "Batch Comparison",
      icon: GitCompareArrows,
      group: "Navigate",
      keywords: "scatter incremental lift",
      run: () =>
        scrollToSection(
          'section[aria-label="Batch comparison and audit timeline"]',
          "Batch Comparison",
        ),
    },
    {
      id: "nav-audit",
      label: "Audit Timeline",
      icon: ScrollText,
      group: "Navigate",
      keywords: "compliance evidence log events",
      run: () =>
        scrollToSection(
          'section[aria-label="Audit timeline"]',
          "Audit Timeline",
        ),
    },
    {
      id: "nav-debtors",
      label: "Debtor Registry",
      icon: Users,
      group: "Navigate",
      keywords: "drilldown search token",
      run: () =>
        scrollToSection(
          'section[aria-label="Debtor registry and drill-down"]',
          "Debtor Registry",
        ),
    },
    // Actions
    {
      id: "action-theme",
      label: resolvedTheme === "dark" ? "Switch to light theme" : "Switch to dark theme",
      icon: resolvedTheme === "dark" ? Sun : Moon,
      group: "Actions",
      keywords: "toggle day night mode",
      run: () => {
        const next = resolvedTheme === "dark" ? "light" : "dark";
        setTheme(next);
        setOpen(false);
        toast.success(`Switched to ${next} theme`);
      },
    },
    {
      id: "action-stop-focus",
      label: "Focus Stop-Rule Simulator",
      icon: PhoneOff,
      group: "Actions",
      keywords: "type phrase hinglish",
      run: () => {
        setOpen(false);
        const inp = document.querySelector(
          'input[aria-label="Stop phrase"]',
        ) as HTMLInputElement | null;
        inp?.focus();
        inp?.scrollIntoView({ behavior: "smooth", block: "center" });
      },
    },
    {
      id: "action-audit-export",
      label: "Export Audit Timeline (CSV)",
      icon: Download,
      group: "Actions",
      keywords: "download compliance csv report",
      run: async () => {
        setOpen(false);
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
      id: "action-help",
      label: "Show keyboard shortcuts",
      icon: Keyboard,
      group: "Actions",
      keywords: "help keys",
      run: () => {
        setOpen(false);
        toast.info("Keyboard shortcuts", {
          description:
            "S — focus stop-rule · T — toggle theme · B — batch selector · Cmd+K — command palette · ? — this help",
        });
      },
    },
  ];

  const groups = React.useMemo(() => {
    const map = new Map<string, CommandEntry[]>();
    for (const e of entries) {
      const arr = map.get(e.group) ?? [];
      arr.push(e);
      map.set(e.group, arr);
    }
    return Array.from(map.entries());
  }, [entries]);

  return (
    <>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search commands and sections…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {groups.map(([groupName, items]) => (
            <CommandGroup key={groupName} heading={groupName}>
              {items.map((entry) => {
                const Icon = entry.icon;
                return (
                  <CommandItem
                    key={entry.id}
                    value={`${entry.label} ${entry.keywords ?? ""} ${entry.hint ?? ""}`}
                    onSelect={() => entry.run()}
                    className="gap-2"
                  >
                    <Icon className="size-4 text-muted-foreground" aria-hidden />
                    <span className="flex-1">{entry.label}</span>
                    {entry.hint && (
                      <span className="text-[10px] text-muted-foreground">
                        {entry.hint}
                      </span>
                    )}
                  </CommandItem>
                );
              })}
              <CommandSeparator />
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
