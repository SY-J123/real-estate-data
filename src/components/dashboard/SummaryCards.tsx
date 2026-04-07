"use client";

import type { SummaryStats } from "@/types";

interface SummaryCardsProps {
  stats: SummaryStats | null;
}

function formatPrice(value: number): string {
  if (value >= 10000) {
    const eok = Math.floor(value / 10000);
    const remainder = Math.round(value % 10000);
    if (remainder === 0) return `${eok}억`;
    return `${eok}억 ${remainder.toLocaleString()}만`;
  }
  return `${value.toLocaleString()}만`;
}

function formatChange(value: number): { text: string; color: string } {
  const sign = value > 0 ? "+" : "";
  return {
    text: `${sign}${value.toFixed(1)}%`,
    color: value > 0 ? "text-red-500" : value < 0 ? "text-blue-500" : "text-zinc-500",
  };
}

interface CardProps {
  label: string;
  value: string;
  sub?: string;
  subColor?: string;
  disabled?: boolean;
}

function Card({ label, value, sub, subColor, disabled }: CardProps) {
  return (
    <div className={`relative rounded-lg border border-zinc-200 bg-white p-4 ${disabled ? "opacity-50" : ""}`}>
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-zinc-900">{value}</p>
      {sub && (
        <p className={`mt-0.5 text-xs font-medium ${subColor ?? "text-zinc-400"}`}>
          {sub}
        </p>
      )}
    </div>
  );
}

export default function SummaryCards({ stats }: SummaryCardsProps) {
  if (!stats) return null;

  const oneMonth = formatChange(stats.oneMonthChange);
  const oneYear = formatChange(stats.oneYearChange);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <Card
        label="서울 평균 매매 평당가"
        value={formatPrice(stats.avgPrice)}
        sub="만원/평 (3.3㎡)"
      />
      <Card
        label="서울 평균 전세 평당가"
        value={formatPrice(stats.avgJeonsePrice)}
        sub="만원/평 (3.3㎡)"
      />
      <Card
        label="최근 1개월 상승률"
        value={oneMonth.text}
        subColor={oneMonth.color}
        sub="전월 대비"
      />
      <Card
        label="최근 1년 상승률"
        value={oneYear.text}
        subColor={oneYear.color}
        sub="전년 동기 대비"
      />
      <Card
        label="매매 거래량"
        value={`${stats.transactionCount.toLocaleString()}건`}
        sub="선택 기간 내"
      />
      <Card
        label="서울 미분양"
        value="—"
        sub="준비중"
        disabled
      />
    </div>
  );
}
