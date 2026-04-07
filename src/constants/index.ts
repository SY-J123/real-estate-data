export const MONTHS_OPTIONS = [1, 3, 6, 12] as const;

export const METRIC_OPTIONS = [
  { value: "price", label: "실거래가" },
  { value: "jeonse", label: "전세가" },
  { value: "jeonseRate", label: "전세가율" },
] as const;

export const SEOUL_DISTRICTS = [
  "강남구", "강동구", "강북구", "강서구", "관악구",
  "광진구", "구로구", "금천구", "노원구", "도봉구",
  "동대문구", "동작구", "마포구", "서대문구", "서초구",
  "성동구", "성북구", "송파구", "양천구", "영등포구",
  "용산구", "은평구", "종로구", "중구", "중랑구",
] as const;

export const RANKING_DISPLAY_COUNT = 5;

export const CHANGE_RATE_COLORS = {
  positive: "#ef4444", // 빨강 (상승)
  negative: "#3b82f6", // 파랑 (하락)
  neutral: "#6b7280",  // 회색
} as const;

export const MAP_CENTER: [number, number] = [37.5665, 126.978];
export const MAP_ZOOM = 11;
