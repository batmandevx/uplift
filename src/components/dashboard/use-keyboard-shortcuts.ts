"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";

// Global keyboard shortcuts for the dashboard:
//   S — focus the stop-rule simulator input (handled in StopRuleSimulator)
//   T — toggle light/dark theme
//   B — open the batch selector dropdown
//   ? — show a toast listing all shortcuts
//
// Shortcuts are ignored when the user is typing in an input/textarea/select or
// a contentEditable element, and when modifier keys (Cmd/Ctrl/Alt) are held.
export function useKeyboardShortcuts() {
  const { resolvedTheme, setTheme } = useTheme();

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const isEditable =
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        target?.isContentEditable;
      if (isEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key.toLowerCase();

      if (key === "t") {
        e.preventDefault();
        const next = resolvedTheme === "dark" ? "light" : "dark";
        setTheme(next);
        toast.success(`Switched to ${next} theme`, {
          description: "Press T again to toggle back.",
        });
      } else if (key === "b") {
        e.preventDefault();
        const trigger = document.getElementById("batch-selector-trigger");
        if (trigger) {
          trigger.focus();
          // Radix Select opens on pointerdown/click of the trigger button
          trigger.click();
          toast.info("Batch selector opened", {
            description: "Use arrow keys to navigate, Enter to select.",
          });
        }
      } else if (key === "?") {
        e.preventDefault();
        toast.info("Keyboard shortcuts", {
          description:
            "S — focus stop-rule simulator · T — toggle theme · B — open batch selector · ? — show this help",
        });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [resolvedTheme, setTheme]);
}
