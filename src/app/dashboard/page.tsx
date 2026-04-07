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
          <SeoulMap districtData={districtData} dongData={dongData} metric={filter.metric} />
          <GainersLosers
            districtData={districtData}
            dongData={dongData}
            metric={filter.metric}
          />
          <PriceChart districtData={districtData} metric={filter.metric} />
        </div>
      )}

      <footer className="border-t border-zinc-200 pt-4 text-xs text-zinc-400">
        <p>데이터 출처: 국토교통부 실거래가 공개시스템 (아파트 매매/전월세 실거래가)</p>
        <p className="mt-1">
          <a href="https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev" className="underline hover:text-zinc-600" target="_blank" rel="noopener noreferrer">매매 실거래가 API</a>
          {" / "}
          <a href="https://apis.data.go.kr/1613000/RTMSDataSvcAptRent" className="underline hover:text-zinc-600" target="_blank" rel="noopener noreferrer">전월세 실거래가 API</a>
        </p>
        <p className="mt-2">&copy; {new Date().getFullYear()} Siyoung. All rights reserved.</p>
      </footer>
    </div>
  );
}
