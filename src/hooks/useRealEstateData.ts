"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchDistrictData, fetchDongData, fetchLastUpdated } from "@/lib/api";
import type { DistrictData, DongData, FilterState } from "@/types";

interface UseRealEstateDataReturn {
  districtData: DistrictData[];
  dongData: DongData[];
  lastUpdated: string | null;
  isLoading: boolean;
  error: string | null;
  filter: FilterState;
  setFilter: (filter: FilterState) => void;
}

export function useRealEstateData(): UseRealEstateDataReturn {
  const [districtData, setDistrictData] = useState<DistrictData[]>([]);
  const [dongData, setDongData] = useState<DongData[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterState>({
    months: 3,
    metric: "price",
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [districts, dongs, updated] = await Promise.all([
        fetchDistrictData(filter.months),
        fetchDongData(filter.months),
        fetchLastUpdated(),
      ]);

      setDistrictData(districts);
      setDongData(dongs);
      setLastUpdated(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "데이터를 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [filter.months]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    districtData,
    dongData,
    lastUpdated,
    isLoading,
    error,
    filter,
    setFilter,
  };
}
