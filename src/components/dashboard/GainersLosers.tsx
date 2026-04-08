"use client";

import { RANKING_DISPLAY_COUNT, CHANGE_RATE_COLORS } from "@/constants";
import Card from "@/components/ui/Card";
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

  const isRatio = metric === "jeonseRatio";

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <RankingCard
        title={isRatio ? "전세가율 높은 구 TOP" : "구별 상승 TOP"}
        items={districtGainers}
        type="gainer"
        formatLabel={(d) => d.gu}
        getValue={rate}
        unit="%"
        isAbsolute={isRatio}
      />
      <RankingCard
        title={isRatio ? "전세가율 낮은 구 TOP" : "구별 하락 TOP"}
        items={districtLosers}
        type="loser"
        formatLabel={(d) => d.gu}
        getValue={rate}
        unit="%"
        isAbsolute={isRatio}
      />
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
  isAbsolute?: boolean;
}

function RankingCard<T>({
  title,
  items,
  type,
  formatLabel,
  getValue,
  unit = "%",
  isAbsolute = false,
}: RankingCardProps<T>) {
  const color =
    isAbsolute
      ? "#8b5cf6"
      : type === "gainer"
        ? CHANGE_RATE_COLORS.positive
        : CHANGE_RATE_COLORS.negative;

  return (
    <Card>
      <h3 className="mb-3 text-sm font-semibold text-text-secondary">{title}</h3>
      <ul className="space-y-2">
        {items.map((item, idx) => {
          const v = getValue(item);
          return (
            <li key={idx} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-bg-muted text-xs font-bold text-text-muted">
                  {idx + 1}
                </span>
                <span className="text-sm text-text-primary">{formatLabel(item)}</span>
              </div>
              <span className="text-sm font-semibold" style={{ color }}>
                {!isAbsolute && v > 0 ? "+" : ""}{v.toFixed(1)}{unit}
              </span>
            </li>
          );
        })}
        {items.length === 0 && (
          <li className="text-sm text-text-faint">데이터 없음</li>
        )}
      </ul>
    </Card>
  );
}
