import type { DistrictData, DongData, MonthlyAvgData, AreaType } from "@/types";

// 정적 JSON 캐시 (한 번만 fetch)
let dashboardCache: DashboardJSON | null = null;

interface DashboardJSON {
  lastUpdated: string;
  districtSummary: Record<string, DistrictData[]>;
  dongSummary: Record<string, DongData[]>;
  monthlyAvg: Record<string, MonthlyAvgData[]>;
}

async function getDashboard(): Promise<DashboardJSON> {
  if (dashboardCache) return dashboardCache;
  const res = await fetch("/data/dashboard.json");
  if (!res.ok) throw new Error("대시보드 데이터를 불러올 수 없습니다.");
  dashboardCache = await res.json();
  return dashboardCache!;
}

// 구별 집계 데이터 조회
export async function fetchDistrictData(months: number, area: AreaType = "all"): Promise<DistrictData[]> {
  const dashboard = await getDashboard();
  return dashboard.districtSummary[`${months}_${area}`] ?? [];
}

// 동별 집계 데이터 조회
export async function fetchDongData(months: number, area: AreaType = "all"): Promise<DongData[]> {
  const dashboard = await getDashboard();
  return dashboard.dongSummary[`${months}_${area}`] ?? [];
}

// 서울 전체 월별 평균 매매 평당가 조회
export async function fetchMonthlyAvg(months: number): Promise<MonthlyAvgData[]> {
  const dashboard = await getDashboard();
  return dashboard.monthlyAvg[String(months)] ?? [];
}

// 데이터 최종 업데이트 시각 조회
export async function fetchLastUpdated(): Promise<string | null> {
  const dashboard = await getDashboard();
  return dashboard.lastUpdated ?? null;
}
