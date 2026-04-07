"use client";

import dynamic from "next/dynamic";
import { useRealEstateData } from "@/hooks/useRealEstateData";
import FilterBar from "@/components/common/FilterBar";
import DataTimestamp from "@/components/common/DataTimestamp";
import SummaryCards from "@/components/dashboard/SummaryCards";
import GainersLosers from "@/components/dashboard/GainersLosers";
import PriceChart from "@/components/dashboard/PriceChart";
import VolumeChart from "@/components/dashboard/VolumeChart";
import UnsoldChart from "@/components/dashboard/UnsoldChart";

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
    monthlyAvgData,
    summaryStats,
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
          <SummaryCards stats={summaryStats} />
          <SeoulMap districtData={districtData} metric={filter.metric} />
          <GainersLosers
            districtData={districtData}
            metric={filter.metric}
          />
          <PriceChart monthlyAvgData={monthlyAvgData} />
          <VolumeChart monthlyAvgData={monthlyAvgData} />
          <UnsoldChart />
        </div>
      )}

      <footer className="space-y-3 border-t border-zinc-200 pt-4 text-xs text-zinc-400">
        <div>
          <p className="font-medium text-zinc-500">데이터 특성</p>
          <ul className="mt-1 list-inside list-disc space-y-0.5">
            <li>서울 25개 구 아파트 매매/전세 실거래가 (2021.01 ~ 현재)</li>
            <li>가격 기준: 평당가 (거래금액 / 전용면적 x 3.3)</li>
            <li>이상치 제거: 매매 평당가 1,000~15,000만원 범위 외 거래 제외</li>
            <li>짧은 기간 선택 시 일부 구의 거래 건수가 적어 변동률이 과대 표시될 수 있음</li>
          </ul>
        </div>
        <div>
          <p>
            데이터 출처: 국토교통부 실거래가 공개시스템&nbsp;
            <a href="https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev" className="underline hover:text-zinc-600" target="_blank" rel="noopener noreferrer">매매 API</a>
            {" / "}
            <a href="https://apis.data.go.kr/1613000/RTMSDataSvcAptRent" className="underline hover:text-zinc-600" target="_blank" rel="noopener noreferrer">전월세 API</a>
          </p>
          <p className="mt-1">&copy; {new Date().getFullYear()} Siyoung. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
