"use client";

import { MONTHS_OPTIONS, METRIC_OPTIONS, AREA_OPTIONS } from "@/constants";
import type { FilterState, MetricType, AreaType } from "@/types";

interface FilterBarProps {
  filter: FilterState;
  onFilterChange: (filter: FilterState) => void;
}

export default function FilterBar({ filter, onFilterChange }: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border border-zinc-200 bg-white p-4">
      {/* 기간 필터 */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-zinc-600">기간</span>
        <select
          value={filter.months}
          onChange={(e) =>
            onFilterChange({ ...filter, months: Number(e.target.value) })
          }
          className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 outline-none focus:border-zinc-400"
        >
          {MONTHS_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* 면적 필터 */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-zinc-600">면적</span>
        <select
          value={filter.area}
          onChange={(e) =>
            onFilterChange({ ...filter, area: e.target.value as AreaType })
          }
          className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 outline-none focus:border-zinc-400"
        >
          {AREA_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* 지표 필터 */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-zinc-600">지표</span>
        <div className="flex gap-1">
          {METRIC_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() =>
                onFilterChange({ ...filter, metric: value as MetricType })
              }
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                filter.metric === value
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
