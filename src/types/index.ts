// 구 단위 데이터
export interface DistrictData {
  gu: string;
  avgPrice: number;
  prevAvgPrice: number;
  changeRate: number; // 매매 증감률 (%)
  transactionCount: number;
  avgJeonsePrice: number;
  prevAvgJeonsePrice: number;
  jeonseChangeRate: number; // 전세가 증감률 (%)
}

// 동 단위 데이터
export interface DongData {
  gu: string;
  dong: string;
  avgPrice: number;
  prevAvgPrice: number;
  changeRate: number;
  transactionCount: number;
  avgJeonsePrice: number;
  prevAvgJeonsePrice: number;
  jeonseChangeRate: number;
}

// 개별 거래 데이터
export interface Transaction {
  id: string;
  gu: string;
  dong: string;
  aptName: string;
  area: number; // 전용면적 (㎡)
  floor: number;
  price: number; // 만원
  dealDate: string; // YYYY-MM-DD
  buildYear: number;
  dealType: "매매" | "전세" | "월세";
}

// 면적 구간
export type AreaType = "all" | "small" | "medium" | "large";

// 필터 상태
export interface FilterState {
  months: number; // 최근 N개월
  metric: MetricType;
  area: AreaType;
}

// 지표 타입
export type MetricType = "price" | "jeonse";

// metric에 따른 증감률 선택
export function getChangeRate(d: DistrictData | DongData, metric: MetricType): number {
  if (metric === "jeonse") return d.jeonseChangeRate;
  return d.changeRate;
}

// 상단 요약 카드 데이터
export interface SummaryStats {
  avgPrice: number;         // 서울 평균 매매 평당가 (만원/평)
  avgJeonsePrice: number;   // 서울 평균 전세 평당가 (만원/평)
  oneMonthChange: number;   // 최근 1개월 상승률 (%)
  oneYearChange: number;    // 최근 1년 상승률 (%)
  transactionCount: number; // 매매 거래량
}

// 서울 전체 월별 평균 평당가 + 거래량
export interface MonthlyAvgData {
  month: string; // YYYY-MM
  avgPrice: number; // 만원/평
  count: number; // 매매 거래 건수
}

// 가설 검정
export interface Hypothesis {
  id: string;
  title: string;
  description: string;
  method: string;
  result: "supported" | "rejected" | "inconclusive";
  pValue: number;
  testStat: number;
  chartData: HypothesisChartData[];
  chartType?: "bar" | "line" | "overlay" | "multi_overlay";
  lineCharts?: LineChartPanel[];
  chartGroups?: ChartGroup[];
  details: Record<string, unknown>;
}

export interface HypothesisChartData {
  label: string;
  groupA: number;
  groupB: number;
}

export interface LineChartPanel {
  title: string;
  color: string;
  data: { date: string; value: number }[];
}

// 여러 overlay 차트를 묶는 그룹
export interface ChartGroup {
  title: string;
  lineCharts: LineChartPanel[];
}

// 지도용 GeoJSON
export interface SeoulGeoFeature {
  type: "Feature";
  properties: {
    name: string;
    code: string;
  };
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][] | number[][][][];
  };
}
