"use client";

import { RANKING_DISPLAY_COUNT, CHANGE_RATE_COLORS } from "@/constants";
import type { DistrictData, MetricType } from "@/types";
import { getChangeRate } from "@/types";

interface GainersLosersProps {
  districtData: DistrictData[];
  metric: MetricType;
}

export default function GainersLosers({
  districtData,
  metric,
}: GainersLosersProps) {
  const rate = (d: DistrictData) => getChangeRate(d, metric);

  const sortedDistricts = [...districtData].sort((a, b) => rate(b) - rate(a));
  const districtGainers = sortedDistricts.slice(0, RANKING_DISPLAY_COUNT);
  const districtLosers = sortedDistricts.slice(-RANKING_DISPLAY_COUNT).reverse();

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <RankingCard title="구별 상승 TOP" items={districtGainers} type="gainer" formatLabel={(d) => d.gu} getValue={rate} unit={"%"} />
      <RankingCard title="구별 하락 TOP" items={districtLosers} type="loser" formatLabel={(d) => d.gu} getValue={rate} unit={"%"} />
    </div>
  );
}

interface RankingCardProps<T> {
  title: string;
  items: T[];
  type: "gainer" | "loser";
  formatLabel: (item: T) => string;
  getValue: (item: T) => number;
  unit?: string;
}

function RankingCard<T>({
  title,
  items,
  type,
  formatLabel,
  getValue,
  unit = "%",
}: RankingCardProps<T>) {
  const color =
    type === "gainer"
      ? CHANGE_RATE_COLORS.positive
      : CHANGE_RATE_COLORS.negative;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-zinc-700">{title}</h3>
      <ul className="space-y-2">
        {items.map((item, idx) => {
          const v = getValue(item);
          return (
            <li key={idx} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold text-zinc-500">
                  {idx + 1}
                </span>
                <span className="text-sm text-zinc-800">{formatLabel(item)}</span>
              </div>
              <span className="text-sm font-semibold" style={{ color }}>
                {v > 0 ? "+" : ""}{v.toFixed(1)}{unit}
              </span>
            </li>
          );
        })}
        {items.length === 0 && (
          <li className="text-sm text-zinc-400">데이터 없음</li>
        )}
      </ul>
    </div>
  );
}
