"use client";

import { useCallback, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "theme-preference";

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(resolved: "light" | "dark") {
  document.documentElement.setAttribute("data-theme", resolved);
}

export function useTheme() {
  const [preference, setPreference] = useState<Theme>("system");
  const [resolved, setResolved] = useState<"light" | "dark">("light");

  // 초기 로드: localStorage → 없으면 system
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    const pref = stored ?? "system";
    setPreference(pref);

    const res = pref === "system" ? getSystemTheme() : pref;
    setResolved(res);
    applyTheme(res);
  }, []);

  // OS 테마 변경 감지 (system 모드일 때만)
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (preference === "system") {
        const res = getSystemTheme();
        setResolved(res);
        applyTheme(res);
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [preference]);

  const setTheme = useCallback((next: Theme) => {
    setPreference(next);
    if (next === "system") {
      localStorage.removeItem(STORAGE_KEY);
      const res = getSystemTheme();
      setResolved(res);
      applyTheme(res);
    } else {
      localStorage.setItem(STORAGE_KEY, next);
      setResolved(next);
      applyTheme(next);
    }
  }, []);

  return { preference, resolved, setTheme };
}
