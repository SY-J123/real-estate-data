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
  jeonseRatio: number; // 전세가율 (%) = 전세 평당가 / 매매 평당가 * 100
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
  jeonseRatio: number;
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
export type MetricType = "price" | "jeonse" | "jeonseRatio";

// metric에 따른 대표값 선택
export function getChangeRate(d: DistrictData | DongData, metric: MetricType): number {
  if (metric === "jeonseRatio") return d.jeonseRatio;
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
  jeonseRatio: number;      // 서울 평균 전세가율 (%)
  baseRate: number;         // 한국은행 기준금리 (%)
  baseRateDate: string;     // 기준금리 최근 결정일 (YYYY-MM-DD)
}

// 서울 전체 월별 평균 평당가 + 거래량
export interface MonthlyAvgData {
  month: string; // YYYY-MM
  avgPrice: number; // 매매 평당가 (만원/평)
  count: number; // 매매 거래 건수
  avgJeonsePrice: number; // 전세 평당가 (만원/평)
  jeonseCount: number; // 전세 거래 건수
  jeonseRatio: number; // 전세가율 (%)
}

// 구별 월별 평당가 + 전세가율
export interface MonthlyGuData {
  month: string;
  avgPrice: number;       // 매매 평당가 (만원/평)
  avgJeonsePrice: number; // 전세 평당가 (만원/평)
  jeonseRatio: number;
}

/** @deprecated Use MonthlyGuData instead */
export type MonthlyGuRatioData = MonthlyGuData;

// 차트 타입
export type ChartType = "bar" | "line" | "overlay" | "multi_overlay";

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
  chartType?: ChartType;
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

// 오류 제보
export type ReportCategory = "price" | "missing" | "duplicate" | "other";
export type ReportStatus = "pending" | "resolved";

export interface Report {
  id: string;
  gu: string;
  category: ReportCategory;
  nickname: string;
  content: string;
  status: ReportStatus;
  created_at: string;
}

// 댓글
export interface Comment {
  id: string;
  hypothesis_id: string;
  nickname: string;
  content: string;
  created_at: string;
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
