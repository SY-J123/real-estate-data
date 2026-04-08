"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { SEOUL_DISTRICTS, DISTRICT_PRESETS } from "@/constants";
import type { MonthlyAvgData, MonthlyGuData } from "@/types";
import { formatPrice, formatPriceCompact } from "@/lib/format";
import Card from "@/components/ui/Card";

/* ── 구별 색상 ── */
const GU_COLORS: Record<string, string> = {
  강남구: "#ef4444", 강동구: "#f97316", 강북구: "#f59e0b", 강서구: "#eab308",
  관악구: "#84cc16", 광진구: "#22c55e", 구로구: "#14b8a6", 금천구: "#06b6d4",
  노원구: "#0ea5e9", 도봉구: "#3b82f6", 동대문구: "#6366f1", 동작구: "#8b5cf6",
  마포구: "#a855f7", 서대문구: "#d946ef", 서초구: "#ec4899", 성동구: "#f43f5e",
  성북구: "#fb923c", 송파구: "#a3e635", 양천구: "#2dd4bf", 영등포구: "#38bdf8",
  용산구: "#818cf8", 은평구: "#c084fc", 종로구: "#e879f9", 중구: "#f472b6",
  중랑구: "#94a3b8",
};

/* ── localStorage 키 ── */
const LS_SELECTED = "price-chart-districts";
const LS_CUSTOM_PRESETS = "price-chart-custom-presets";

interface CustomPreset {
  label: string;
  districts: string[];
}

function loadSelected(): string[] {
  try {
    const raw = localStorage.getItem(LS_SELECTED);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSelected(districts: string[]) {
  localStorage.setItem(LS_SELECTED, JSON.stringify(districts));
}

function loadCustomPresets(): CustomPreset[] {
  try {
    const raw = localStorage.getItem(LS_CUSTOM_PRESETS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCustomPresets(presets: CustomPreset[]) {
  localStorage.setItem(LS_CUSTOM_PRESETS, JSON.stringify(presets));
}

/* ── Props ── */
interface PriceChartProps {
  monthlyAvgData: MonthlyAvgData[];
  monthlyByGu: Record<string, MonthlyGuData[]>;
}

export default function PriceChart({ monthlyAvgData, monthlyByGu }: PriceChartProps) {
  const [selectedGus, setSelectedGus] = useState<string[]>([]);
  const [customPresets, setCustomPresets] = useState<CustomPreset[]>([]);
  const [mounted, setMounted] = useState(false);

  // hydration-safe localStorage load
  useEffect(() => {
    setSelectedGus(loadSelected());
    setCustomPresets(loadCustomPresets());
    setMounted(true);
  }, []);

  // persist selection
  useEffect(() => {
    if (mounted) saveSelected(selectedGus);
  }, [selectedGus, mounted]);

  const toggleGu = useCallback((gu: string) => {
    setSelectedGus((prev) =>
      prev.includes(gu) ? prev.filter((g) => g !== gu) : [...prev, gu],
    );
  }, []);

  const applyPreset = useCallback((districts: readonly string[] | string[]) => {
    setSelectedGus((prev) => {
      const asArr = [...districts];
      const isSame = asArr.length === prev.length && asArr.every((d) => prev.includes(d));
      return isSame ? [] : asArr;
    });
  }, []);

  const handleSavePreset = useCallback(() => {
    if (selectedGus.length === 0) return;
    const name = prompt("프리셋 이름을 입력하세요:");
    if (!name?.trim()) return;
    const next = [...customPresets.filter((p) => p.label !== name.trim()), { label: name.trim(), districts: [...selectedGus] }];
    setCustomPresets(next);
    saveCustomPresets(next);
  }, [selectedGus, customPresets]);

  const handleDeletePreset = useCallback((label: string) => {
    const next = customPresets.filter((p) => p.label !== label);
    setCustomPresets(next);
    saveCustomPresets(next);
  }, [customPresets]);

  /* ── 차트 데이터 ── */
  const hasDistricts = selectedGus.length > 0;
  const months = monthlyAvgData.map((d) => d.month);

  const chartData = months.map((month) => {
    const seoulRow = monthlyAvgData.find((d) => d.month === month);
    const row: Record<string, string | number> = {
      month,
      avgPrice: seoulRow?.avgPrice ?? 0,
      avgJeonsePrice: seoulRow?.avgJeonsePrice ?? 0,
    };
    for (const gu of selectedGus) {
      const guData = monthlyByGu[gu];
      const found = guData?.find((d) => d.month === month);
      row[`${gu}_매매`] = found?.avgPrice ?? 0;
      row[`${gu}_전세`] = found?.avgJeonsePrice ?? 0;
    }
    return row;
  });

  return (
    <Card>
      <h3 className="mb-2 text-sm font-semibold text-text-secondary">
        평균 평당가 — 매매/전세 (월별)
      </h3>

      {/* 프리셋 숏컷 */}
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-medium text-text-muted">프리셋</span>
        {DISTRICT_PRESETS.map((p) => {
          const active = p.districts.length === selectedGus.length
            && p.districts.every((d) => selectedGus.includes(d));
          return (
            <button
              key={p.label}
              onClick={() => applyPreset(p.districts)}
              className={`rounded-md px-2 py-0.5 text-xs font-medium transition-colors ${
                active
                  ? "bg-btn-primary text-text-inverse"
                  : "bg-bg-muted text-text-tertiary hover:bg-bg-subtle"
              }`}
            >
              {p.label}
            </button>
          );
        })}
        {customPresets.map((p) => {
          const active = p.districts.length === selectedGus.length
            && p.districts.every((d) => selectedGus.includes(d));
          return (
            <span key={p.label} className="inline-flex items-center gap-0.5">
              <button
                onClick={() => applyPreset(p.districts)}
                className={`rounded-l-md px-2 py-0.5 text-xs font-medium transition-colors ${
                  active
                    ? "bg-btn-primary text-text-inverse"
                    : "bg-bg-muted text-text-tertiary hover:bg-bg-subtle"
                }`}
              >
                {p.label}
              </button>
              <button
                onClick={() => handleDeletePreset(p.label)}
                className="rounded-r-md bg-bg-muted px-1 py-0.5 text-xs text-text-faint hover:bg-accent-red-bg hover:text-accent-red"
                title="프리셋 삭제"
              >
                x
              </button>
            </span>
          );
        })}
        {selectedGus.length > 0 && (
          <>
            <button
              onClick={handleSavePreset}
              className="rounded-md bg-bg-base px-2 py-0.5 text-xs text-text-faint hover:bg-bg-muted hover:text-text-tertiary"
              title="현재 선택을 프리셋으로 저장"
            >
              + 저장
            </button>
            <button
              onClick={() => setSelectedGus([])}
              className="rounded-md px-2 py-0.5 text-xs text-text-faint hover:bg-bg-muted hover:text-text-tertiary"
            >
              초기화
            </button>
          </>
        )}
      </div>

      {/* 구 선택 칩 */}
      <div className="mb-4 flex flex-wrap gap-1">
        {SEOUL_DISTRICTS.map((gu) => (
          <button
            key={gu}
            onClick={() => toggleGu(gu)}
            className={`rounded-full px-2 py-0.5 text-xs font-medium transition-colors ${
              selectedGus.includes(gu)
                ? "text-text-inverse"
                : "bg-bg-base text-text-faint hover:bg-bg-muted hover:text-text-tertiary"
            }`}
            style={
              selectedGus.includes(gu)
                ? { backgroundColor: GU_COLORS[gu] ?? "#6b7280" }
                : undefined
            }
          >
            {gu.replace("구", "")}
          </button>
        ))}
      </div>

      {/* 차트 */}
      {chartData.length === 0 ? (
        <div className="flex h-[300px] items-center justify-center text-sm text-text-faint">
          해당 기간 데이터가 없습니다.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={380}>
          <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" />
            <YAxis
              yAxisId="price"
              tick={{ fontSize: 12 }}
              tickFormatter={formatPriceCompact}
              domain={["dataMin - 500", "dataMax + 500"]}
            />
            <Tooltip
              formatter={(value, name) => {
                const n = String(name);
                if (n.endsWith("_매매")) return [formatPrice(Number(value)), `${n.replace("_매매", "")} 매매`];
                if (n.endsWith("_전세")) return [formatPrice(Number(value)), `${n.replace("_전세", "")} 전세`];
                return [
                  formatPrice(Number(value)),
                  n === "avgPrice" ? "서울 매매" : "서울 전세",
                ];
              }}
              labelFormatter={(label) => `${label}월`}
            />
            <Legend
              verticalAlign="top"
              wrapperStyle={{ paddingBottom: 12 }}
              formatter={(value) => {
                const v = String(value);
                if (v === "avgPrice") return "서울 매매";
                if (v === "avgJeonsePrice") return "서울 전세";
                if (v.endsWith("_매매")) return `${v.replace("_매매", "")} 매매`;
                if (v.endsWith("_전세")) return `${v.replace("_전세", "")} 전세`;
                return v;
              }}
            />

            {/* 서울 전체 — 구 선택 시 얇은 점선, 아닐 때 막대 */}
            {hasDistricts ? (
              <>
                <Line yAxisId="price" dataKey="avgPrice" stroke="#9ca3af" strokeWidth={1.5} strokeDasharray="6 3" dot={false} />
                <Line yAxisId="price" dataKey="avgJeonsePrice" stroke="#9ca3af" strokeWidth={1} strokeDasharray="4 2" dot={false} />
              </>
            ) : (
              <>
                <Bar yAxisId="price" dataKey="avgPrice" fill="#ef4444" radius={[2, 2, 0, 0]} />
                <Bar yAxisId="price" dataKey="avgJeonsePrice" fill="#3b82f6" radius={[2, 2, 0, 0]} />
              </>
            )}

            {/* 선택된 구 라인 */}
            {selectedGus.map((gu) => (
              <Line
                key={`${gu}_매매`}
                yAxisId="price"
                dataKey={`${gu}_매매`}
                stroke={GU_COLORS[gu] ?? "#6b7280"}
                strokeWidth={2}
                dot={false}
              />
            ))}
            {selectedGus.map((gu) => (
              <Line
                key={`${gu}_전세`}
                yAxisId="price"
                dataKey={`${gu}_전세`}
                stroke={GU_COLORS[gu] ?? "#6b7280"}
                strokeWidth={1.5}
                strokeDasharray="4 2"
                dot={false}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
