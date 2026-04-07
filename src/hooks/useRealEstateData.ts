"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchDistrictData, fetchMonthlyAvg, fetchLastUpdated } from "@/lib/api";
import { BASE_RATE_INFO } from "@/lib/macro";
import type { DistrictData, MonthlyAvgData, SummaryStats, FilterState } from "@/types";

interface UseRealEstateDataReturn {
  districtData: DistrictData[];
  monthlyAvgData: MonthlyAvgData[];
  summaryStats: SummaryStats | null;
  lastUpdated: string | null;
  isLoading: boolean;
  error: string | null;
  filter: FilterState;
  setFilter: (filter: FilterState) => void;
}

function weightedAvgChangeRate(data: DistrictData[]): number {
  const totalCount = data.reduce((s, d) => s + d.transactionCount, 0);
  if (totalCount === 0) return 0;
  const avgPrice = data.reduce((s, d) => s + d.avgPrice * d.transactionCount, 0) / totalCount;
  const prevAvgPrice = data.reduce((s, d) => s + d.prevAvgPrice * d.transactionCount, 0) / totalCount;
  if (prevAvgPrice === 0) return 0;
  return Number(((avgPrice - prevAvgPrice) / prevAvgPrice * 100).toFixed(1));
}

function computeSummaryStats(
  current: DistrictData[],
  oneMonth: DistrictData[],
  oneYear: DistrictData[],
): SummaryStats {
  const totalCount = current.reduce((s, d) => s + d.transactionCount, 0);
  const avgPrice = totalCount > 0
    ? Math.round(current.reduce((s, d) => s + d.avgPrice * d.transactionCount, 0) / totalCount)
    : 0;

  const jeonseDistricts = current.filter((d) => d.avgJeonsePrice > 0);
  const avgJeonsePrice = jeonseDistricts.length > 0
    ? Math.round(jeonseDistricts.reduce((s, d) => s + d.avgJeonsePrice, 0) / jeonseDistricts.length)
    : 0;

  return {
    avgPrice,
    avgJeonsePrice,
    oneMonthChange: weightedAvgChangeRate(oneMonth),
    oneYearChange: weightedAvgChangeRate(oneYear),
    transactionCount: totalCount,
    baseRate: BASE_RATE_INFO.value,
    baseRateDate: BASE_RATE_INFO.date,
  };
}

export function useRealEstateData(): UseRealEstateDataReturn {
  const [districtData, setDistrictData] = useState<DistrictData[]>([]);
  const [monthlyAvgData, setMonthlyAvgData] = useState<MonthlyAvgData[]>([]);
  const [summaryStats, setSummaryStats] = useState<SummaryStats | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterState>({
    months: 3,
    metric: "price",
    area: "all",
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [districts, monthly, updated] = await Promise.all([
        fetchDistrictData(filter.months, filter.area),
        fetchMonthlyAvg(60),
        fetchLastUpdated(),
      ]);
      const [oneMonth, oneYear] = await Promise.all([
        fetchDistrictData(1, filter.area),
        fetchDistrictData(12, filter.area),
      ]);

      setDistrictData(districts);
      setMonthlyAvgData(monthly);
      setLastUpdated(updated);
      setSummaryStats(computeSummaryStats(districts, oneMonth, oneYear));
    } catch (err) {
      setError(err instanceof Error ? err.message : "데이터를 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [filter.months, filter.area]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    districtData,
    monthlyAvgData,
    summaryStats,
    lastUpdated,
    isLoading,
    error,
    filter,
    setFilter,
  };
}
