export const MONTHS_OPTIONS = [
  { value: 1, label: "1개월" },
  { value: 3, label: "3개월" },
  { value: 6, label: "6개월" },
  { value: 12, label: "1년" },
  { value: 36, label: "3년" },
  { value: 60, label: "5년" },
] as const;

export const METRIC_OPTIONS = [
  { value: "price", label: "실거래가" },
  { value: "jeonse", label: "전세가" },
  { value: "jeonseRatio", label: "전세가율" },
] as const;

export const SEOUL_DISTRICTS = [
  "강남구", "강동구", "강북구", "강서구", "관악구",
  "광진구", "구로구", "금천구", "노원구", "도봉구",
  "동대문구", "동작구", "마포구", "서대문구", "서초구",
  "성동구", "성북구", "송파구", "양천구", "영등포구",
  "용산구", "은평구", "종로구", "중구", "중랑구",
] as const;

export const AREA_OPTIONS = [
  { value: "all", label: "전체" },
  { value: "small", label: "소형 (~60㎡)" },
  { value: "medium", label: "중형 (60~85㎡)" },
  { value: "large", label: "대형 (85㎡~)" },
] as const;

// 면적 구간 범위 (RPC 파라미터용)
export const AREA_RANGES = {
  all: { min: 0, max: 9999 },
  small: { min: 0, max: 60 },
  medium: { min: 60, max: 85 },
  large: { min: 85, max: 9999 },
} as const;

// 구 프리셋 그룹 (관심지역 숏컷)
export const DISTRICT_PRESETS = [
  { label: "강남3구", districts: ["강남구", "서초구", "송파구"] },
  { label: "마용성", districts: ["마포구", "용산구", "성동구"] },
  { label: "노도강", districts: ["노원구", "도봉구", "강북구"] },
  { label: "금관구", districts: ["금천구", "관악구", "구로구"] },
] as const;

export const RANKING_DISPLAY_COUNT = 5;

export const CHANGE_RATE_COLORS = {
  positive: "#ef4444", // 빨강 (상승)
  negative: "#3b82f6", // 파랑 (하락)
  neutral: "#6b7280",  // 회색
} as const;

export const MAP_CENTER: [number, number] = [37.5665, 126.978];
export const MAP_ZOOM = 11;
