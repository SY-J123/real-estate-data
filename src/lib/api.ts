import { getSupabase } from "./supabase";
import type { DistrictData, DongData, Transaction, Hypothesis } from "@/types";

// 구별 집계 데이터 조회
export async function fetchDistrictData(months: number): Promise<DistrictData[]> {
  const fromDate = getDateMonthsAgo(months);
  const prevFromDate = getDateMonthsAgo(months * 2);

  const { data, error } = await getSupabase().rpc("get_district_summary", {
    from_date: fromDate,
    prev_from_date: prevFromDate,
  });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapDistrict);
}

function mapDistrict(row: Record<string, unknown>): DistrictData {
  return {
    gu: row.gu as string,
    avgPrice: Number(row.avg_price ?? row.avgPrice ?? 0),
    prevAvgPrice: Number(row.prev_avg_price ?? row.prevAvgPrice ?? 0),
    changeRate: Number(row.change_rate ?? row.changeRate ?? 0),
    transactionCount: Number(row.transaction_count ?? row.transactionCount ?? 0),
    avgJeonsePrice: Number(row.avg_jeonse_price ?? row.avgJeonsePrice ?? 0),
    prevAvgJeonsePrice: Number(row.prev_avg_jeonse_price ?? row.prevAvgJeonsePrice ?? 0),
    jeonseChangeRate: Number(row.jeonse_change_rate ?? row.jeonseChangeRate ?? 0),
    jeonseRate: Number(row.jeonse_rate ?? row.jeonseRate ?? 0),
    prevJeonseRate: Number(row.prev_jeonse_rate ?? row.prevJeonseRate ?? 0),
    jeonseRateChange: Number(row.jeonse_rate_change ?? row.jeonseRateChange ?? 0),
  };
}

// 동별 집계 데이터 조회
export async function fetchDongData(months: number): Promise<DongData[]> {
  const fromDate = getDateMonthsAgo(months);
  const prevFromDate = getDateMonthsAgo(months * 2);

  const { data, error } = await getSupabase().rpc("get_dong_summary", {
    from_date: fromDate,
    prev_from_date: prevFromDate,
  });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row: Record<string, unknown>): DongData => ({
    ...mapDistrict(row),
    dong: row.dong as string,
  }));
}

// 개별 거래 내역 조회
export async function fetchTransactions(
  gu?: string,
  dong?: string,
  months?: number
): Promise<Transaction[]> {
  let query = getSupabase().from("transactions").select("*");

  if (gu) query = query.eq("gu", gu);
  if (dong) query = query.eq("dong", dong);
  if (months) {
    query = query.gte("deal_date", getDateMonthsAgo(months));
  }

  const { data, error } = await query.order("deal_date", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

// 데이터 최종 업데이트 시각 조회
export async function fetchLastUpdated(): Promise<string | null> {
  const { data, error } = await getSupabase()
    .from("metadata")
    .select("value")
    .eq("key", "last_updated")
    .single();

  if (error) return null;
  return data?.value ?? null;
}

// 가설 검정 결과 조회
export async function fetchHypotheses(): Promise<Hypothesis[]> {
  const { data, error } = await getSupabase()
    .from("hypotheses")
    .select("*")
    .order("id");

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const details = typeof row.details === "string" ? JSON.parse(row.details) : row.details;
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      method: row.method,
      result: row.result,
      pValue: row.p_value,
      testStat: row.test_stat,
      chartData: typeof row.chart_data === "string" ? JSON.parse(row.chart_data) : row.chart_data,
      chartType: details?.chart_type ?? "bar",
      lineCharts: details?.line_charts,
      details,
    };
  });
}

// 유틸: N개월 전 날짜 (YYYY-MM-DD)
function getDateMonthsAgo(months: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  return date.toISOString().split("T")[0];
}
