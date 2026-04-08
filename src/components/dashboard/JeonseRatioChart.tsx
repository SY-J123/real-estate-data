"use client";

import { useState, useRef, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { SEOUL_DISTRICTS, DISTRICT_PRESETS } from "@/constants";
import Card from "@/components/ui/Card";
import type { MonthlyAvgData, MonthlyGuRatioData } from "@/types";

interface JeonseRatioChartProps {
  monthlyAvgData: MonthlyAvgData[];
  monthlyByGu: Record<string, MonthlyGuRatioData[]>;
}

const GU_COLORS: Record<string, string> = {
  강남구: "#ef4444", 강동구: "#f97316", 강북구: "#f59e0b", 강서구: "#eab308",
  관악구: "#84cc16", 광진구: "#22c55e", 구로구: "#14b8a6", 금천구: "#06b6d4",
  노원구: "#0ea5e9", 도봉구: "#3b82f6", 동대문구: "#6366f1", 동작구: "#8b5cf6",
  마포구: "#a855f7", 서대문구: "#d946ef", 서초구: "#ec4899", 성동구: "#f43f5e",
  성북구: "#fb923c", 송파구: "#a3e635", 양천구: "#2dd4bf", 영등포구: "#38bdf8",
  용산구: "#818cf8", 은평구: "#c084fc", 종로구: "#e879f9", 중구: "#f472b6",
  중랑구: "#94a3b8",
};

export default function JeonseRatioChart({
  monthlyAvgData,
  monthlyByGu,
}: JeonseRatioChartProps) {
  const [selectedGus, setSelectedGus] = useState<string[]>(["강남구", "서초구", "송파구"]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // 당월 제외 (데이터 불완전)
  const currentMonth = new Date().toISOString().slice(0, 7);
  const filtered = monthlyAvgData.filter((d) => d.month < currentMonth);

  const months = filtered.map((d) => d.month);
  const chartData = months.map((month) => {
    const row: Record<string, string | number> = {
      month,
      서울전체: filtered.find((d) => d.month === month)?.jeonseRatio ?? 0,
    };
    for (const gu of selectedGus) {
      const found = monthlyByGu[gu]?.find((d) => d.month === month);
      row[gu] = found?.jeonseRatio ?? 0;
    }
    return row;
  });

  const toggleGu = (gu: string) => {
    setSelectedGus((prev) =>
      prev.includes(gu) ? prev.filter((g) => g !== gu) : [...prev, gu],
    );
  };

  const applyPreset = (districts: readonly string[]) => {
    setSelectedGus([...districts]);
  };

  return (
    <Card>
      <h3 className="mb-3 text-sm font-semibold text-zinc-700">
        구별 전세가율 추이 (월별)
      </h3>

      {/* 프리셋 + 개별 구 드롭다운 */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {DISTRICT_PRESETS.map(({ label, districts }) => {
          const isActive = districts.every((d) => selectedGus.includes(d))
            && selectedGus.length === districts.length;
          return (
            <button
              key={label}
              onClick={() => applyPreset(districts)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-violet-600 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {label}
            </button>
          );
        })}

        {/* 개별 구 드롭다운 */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className="rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
          >
            직접 선택 ({selectedGus.length}구)
            <span className="ml-1 text-zinc-400">{dropdownOpen ? "▲" : "▼"}</span>
          </button>
          {dropdownOpen && (
            <div className="absolute left-0 top-full z-20 mt-1 grid max-h-60 w-64 grid-cols-2 gap-0.5 overflow-y-auto rounded-lg border border-zinc-200 bg-white p-2 shadow-lg">
              {SEOUL_DISTRICTS.map((gu) => (
                <label
                  key={gu}
                  className="flex cursor-pointer items-center gap-1.5 rounded px-2 py-1 text-xs hover:bg-zinc-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedGus.includes(gu)}
                    onChange={() => toggleGu(gu)}
                    className="accent-violet-600"
                  />
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: GU_COLORS[gu] }}
                  />
                  {gu}
                </label>
              ))}
            </div>
          )}
        </div>

        {selectedGus.length > 0 && (
          <button
            onClick={() => setSelectedGus([])}
            className="text-xs text-zinc-400 hover:text-zinc-600"
          >
            초기화
          </button>
        )}
      </div>

      {/* 선택된 구 태그 */}
      {selectedGus.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1">
          {selectedGus.map((gu) => (
            <span
              key={gu}
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white"
              style={{ backgroundColor: GU_COLORS[gu] ?? "#6b7280" }}
            >
              {gu.replace(/구$/, "")}
              <button onClick={() => toggleGu(gu)} className="hover:opacity-70">×</button>
            </span>
          ))}
        </div>
      )}

      {chartData.length === 0 ? (
        <div className="flex h-[300px] items-center justify-center text-sm text-zinc-400">
          해당 기간 데이터가 없습니다.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor="end"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(v) => `${v}%`}
              domain={["dataMin - 5", "dataMax + 5"]}
            />
            <Tooltip
              formatter={(value, name) => [`${Number(value).toFixed(1)}%`, name]}
              labelFormatter={(label) => `${label}월`}
            />
            <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: 8 }} />
            <Line
              dataKey="서울전체"
              stroke="#9ca3af"
              strokeWidth={2}
              strokeDasharray="6 3"
              dot={false}
            />
            {selectedGus.map((gu) => (
              <Line
                key={gu}
                dataKey={gu}
                stroke={GU_COLORS[gu] ?? "#6b7280"}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
