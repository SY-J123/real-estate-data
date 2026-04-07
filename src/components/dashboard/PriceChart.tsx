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
import type { DistrictData } from "@/types";

interface PriceChartProps {
  districtData: DistrictData[];
}

export default function PriceChart({ districtData }: PriceChartProps) {
  const sorted = [...districtData].sort((a, b) => b.changeRate - a.changeRate);

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <h3 className="mb-4 text-sm font-semibold text-zinc-700">
        구별 증감률 (%)
      </h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={sorted} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="gu"
            tick={{ fontSize: 11 }}
            angle={-45}
            textAnchor="end"
          />
          <YAxis tick={{ fontSize: 12 }} unit="%" />
          <Tooltip
            formatter={(value) => [`${Number(value).toFixed(1)}%`, "증감률"]}
          />
          <Bar dataKey="changeRate" radius={[4, 4, 0, 0]}>
            {sorted.map((entry, idx) => (
              <Cell
                key={idx}
                fill={
                  entry.changeRate >= 0
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
