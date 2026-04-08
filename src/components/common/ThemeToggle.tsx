"use client";

import { useTheme } from "@/hooks/useTheme";

const OPTIONS = [
  { value: "light" as const, label: "L", title: "라이트 모드" },
  { value: "dark" as const, label: "D", title: "다크 모드" },
  { value: "system" as const, label: "A", title: "시스템 설정" },
];

export default function ThemeToggle() {
  const { preference, setTheme } = useTheme();

  return (
    <div className="flex rounded-md border border-border-default">
      {OPTIONS.map(({ value, label, title }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          title={title}
          className={`px-2 py-1 text-xs font-medium transition-colors first:rounded-l-md last:rounded-r-md ${
            preference === value
              ? "bg-btn-primary text-text-inverse"
              : "text-text-muted hover:bg-bg-muted"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
