"use client";

import { RANKING_DISPLAY_COUNT, CHANGE_RATE_COLORS } from "@/constants";
import type { DistrictData, DongData, MetricType } from "@/types";

interface GainersLosersProps {
  districtData: DistrictData[];
  dongData: DongData[];
  metric: MetricType;
}

export default function GainersLosers({
  districtData,
  dongData,
  metric,
}: GainersLosersProps) {
  const sortedDistricts = [...districtData].sort(
    (a, b) => b.changeRate - a.changeRate
  );
  const districtGainers = sortedDistricts.slice(0, RANKING_DISPLAY_COUNT);
  const districtLosers = sortedDistricts.slice(-RANKING_DISPLAY_COUNT).reverse();

  const sortedDongs = [...dongData].sort(
    (a, b) => b.changeRate - a.changeRate
  );
  const dongGainers = sortedDongs.slice(0, RANKING_DISPLAY_COUNT);
  const dongLosers = sortedDongs.slice(-RANKING_DISPLAY_COUNT).reverse();

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* 구 단위 */}
      <RankingCard title="구별 상승 TOP" items={districtGainers} type="gainer" formatLabel={(d) => d.gu} />
      <RankingCard title="구별 하락 TOP" items={districtLosers} type="loser" formatLabel={(d) => d.gu} />

      {/* 동 단위 */}
      <RankingCard
        title="동별 상승 TOP"
        items={dongGainers}
        type="gainer"
        formatLabel={(d) => `${(d as DongData).gu} ${(d as DongData).dong}`}
      />
      <RankingCard
        title="동별 하락 TOP"
        items={dongLosers}
        type="loser"
        formatLabel={(d) => `${(d as DongData).gu} ${(d as DongData).dong}`}
      />
    </div>
  );
}

interface RankingCardProps<T extends { changeRate: number }> {
  title: string;
  items: T[];
  type: "gainer" | "loser";
  formatLabel: (item: T) => string;
}

function RankingCard<T extends { changeRate: number }>({
  title,
  items,
  type,
  formatLabel,
}: RankingCardProps<T>) {
  const color =
    type === "gainer"
      ? CHANGE_RATE_COLORS.positive
      : CHANGE_RATE_COLORS.negative;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-zinc-700">{title}</h3>
      <ul className="space-y-2">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold text-zinc-500">
                {idx + 1}
              </span>
              <span className="text-sm text-zinc-800">{formatLabel(item)}</span>
            </div>
            <span
              className="text-sm font-semibold"
              style={{ color }}
            >
              {item.changeRate > 0 ? "+" : ""}
              {item.changeRate.toFixed(1)}%
            </span>
          </li>
        ))}
        {items.length === 0 && (
          <li className="text-sm text-zinc-400">데이터 없음</li>
        )}
      </ul>
    </div>
  );
}
