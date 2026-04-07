"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { MonthlyAvgData } from "@/types";

interface VolumeChartProps {
  monthlyAvgData: MonthlyAvgData[];
}

export default function VolumeChart({ monthlyAvgData }: VolumeChartProps) {
  const chartData = monthlyAvgData.map((d) => ({
    month: d.month,
    count: d.count,
  }));

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <h3 className="mb-4 text-sm font-semibold text-zinc-700">
        월별 매매 거래량
      </h3>
      {chartData.length === 0 ? (
        <div className="flex h-[300px] items-center justify-center text-sm text-zinc-400">
          해당 기간 데이터가 없습니다.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor="end"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(v) => `${(v as number).toLocaleString()}`}
            />
            <Tooltip
              formatter={(value) => [`${Number(value).toLocaleString()}건`, "거래량"]}
              labelFormatter={(label) => `${label}월`}
            />
            <Bar dataKey="count" fill="#3b82f6" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
