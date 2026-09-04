"use client";

import React from "react";
import { useTheme, Theme } from "@/context/ThemeContext";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const toggleTheme = () => {
    if (theme === "dark") setTheme("light");
    else if (theme === "light") setTheme("system");
    else setTheme("dark");
  };

  const getIcon = () => {
    if (theme === "system") return "💻";
    return resolvedTheme === "dark" ? "🌙" : "☀️";
  };

  const getLabel = () => {
    if (theme === "system") return "System Theme";
    return resolvedTheme === "dark" ? "Dark Mode" : "Light Mode";
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`p-2 rounded-xl bg-card-subtle hover:bg-card-hover border border-subtle text-muted hover:text-primary transition flex items-center gap-1.5 text-xs font-semibold ${className}`}
      title={`Current: ${getLabel()} (Click to toggle)`}
      aria-label="Toggle theme"
    >
      <span className="text-sm">{getIcon()}</span>
    </button>
  );
}

export default ThemeToggle;
