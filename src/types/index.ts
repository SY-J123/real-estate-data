// 구 단위 데이터
export interface DistrictData {
  gu: string;
  avgPrice: number;
  prevAvgPrice: number;
  changeRate: number; // 증감률 (%)
  transactionCount: number;
  jeonseRate: number; // 전세가율 (%)
  avgJeonsePrice: number;
}

// 동 단위 데이터
export interface DongData {
  gu: string;
  dong: string;
  avgPrice: number;
  prevAvgPrice: number;
  changeRate: number;
  transactionCount: number;
  jeonseRate: number;
  avgJeonsePrice: number;
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

// 필터 상태
export interface FilterState {
  months: number; // 최근 N개월
  metric: MetricType;
}

// 지표 타입
export type MetricType = "price" | "jeonse" | "jeonseRate";

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
  details: Record<string, unknown>;
}

export interface HypothesisChartData {
  label: string;
  groupA: number;
  groupB: number;
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
