"use client";

import dynamic from "next/dynamic";
import { useRealEstateData } from "@/hooks/useRealEstateData";
import FilterBar from "@/components/common/FilterBar";
import DataTimestamp from "@/components/common/DataTimestamp";
import GainersLosers from "@/components/dashboard/GainersLosers";
import PriceChart from "@/components/dashboard/PriceChart";

const SeoulMap = dynamic(() => import("@/components/dashboard/SeoulMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[500px] items-center justify-center rounded-lg border border-zinc-200 bg-white">
      <span className="text-sm text-zinc-400">지도 로딩 중...</span>
    </div>
  ),
});

export default function DashboardPage() {
  const {
    districtData,
    dongData,
    lastUpdated,
    isLoading,
    error,
    filter,
    setFilter,
  } = useRealEstateData();

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 py-8">
      <div className="flex items-end justify-between">
        <h1 className="text-2xl font-bold text-zinc-900">대시보드</h1>
        <DataTimestamp lastUpdated={lastUpdated} />
      </div>

      <FilterBar filter={filter} onFilterChange={setFilter} />

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <span className="text-sm text-zinc-400">데이터 로딩 중...</span>
        </div>
      ) : (
        <div className="space-y-6">
          <GainersLosers
            districtData={districtData}
            dongData={dongData}
            metric={filter.metric}
          />
          <PriceChart districtData={districtData} />
          <SeoulMap districtData={districtData} />
        </div>
      )}
    </div>
  );
}
