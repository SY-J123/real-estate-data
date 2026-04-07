"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { CHANGE_RATE_COLORS } from "@/constants";
import type { DistrictData, MetricType } from "@/types";
import { getChangeRate } from "@/types";

const METRIC_LABELS: Record<MetricType, string> = {
  price: "매매가 증감률",
  jeonse: "전세가 증감률",
  jeonseRate: "전세가율 증감",
};

interface PriceChartProps {
  districtData: DistrictData[];
  metric: MetricType;
}

export default function PriceChart({ districtData, metric }: PriceChartProps) {
  const chartData = districtData
    .map((d) => ({ gu: d.gu, value: getChangeRate(d, metric) }))
    .sort((a, b) => b.value - a.value);

  const unit = metric === "jeonseRate" ? "%p" : "%";

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <h3 className="mb-4 text-sm font-semibold text-zinc-700">
        구별 {METRIC_LABELS[metric]} ({unit})
      </h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="gu"
            tick={{ fontSize: 11 }}
            angle={-45}
            textAnchor="end"
          />
          <YAxis tick={{ fontSize: 12 }} unit={unit} />
          <Tooltip
            formatter={(value) => [`${Number(value).toFixed(1)}${unit}`, METRIC_LABELS[metric]]}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, idx) => (
              <Cell
                key={idx}
                fill={
                  entry.value >= 0
                    ? CHANGE_RATE_COLORS.positive
                    : CHANGE_RATE_COLORS.negative
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
