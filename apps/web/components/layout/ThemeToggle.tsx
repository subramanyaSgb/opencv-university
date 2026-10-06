"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun, BookOpen } from "lucide-react";
import { applyTheme, readStoredTheme, storeTheme, THEMES, type Theme } from "@/lib/theme";

const OPTIONS: { value: Theme; label: string; Icon: typeof Sun }[] = [
  { value: "auto", label: "Match system", Icon: Monitor },
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "sepia", label: "Sepia", Icon: BookOpen },
];

/** Cycles Auto -> Light -> Dark -> Sepia; persists the choice and applies it instantly. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("auto");

  useEffect(() => {
    setTheme(readStoredTheme());
  }, []);

  const cycle = () => {
    const next = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
    setTheme(next);
    storeTheme(next);
    applyTheme(next);
  };

  const current = OPTIONS.find((o) => o.value === theme) ?? OPTIONS[0];
  const Icon = current.Icon;

  return (
    <button type="button" className="icon-btn" onClick={cycle} aria-label={`Theme: ${current.label}. Click to change.`} title={`Theme: ${current.label}`}>
      <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
    </button>
  );
}
