"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

const NAV_ITEMS = [
  { href: "/dashboard", label: "대시보드" },
  { href: "/hypothesis", label: "가설 검정" },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-border-default bg-bg-card">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <Link href="/dashboard" className="text-lg font-bold text-text-primary">
          서울 부동산 대시보드
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {NAV_ITEMS.map(({ href, label }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-btn-primary text-text-inverse"
                      : "text-text-tertiary hover:bg-bg-muted hover:text-text-primary"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
