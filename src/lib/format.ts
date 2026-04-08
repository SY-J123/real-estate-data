/** 가격을 "1억 5,000만" 형태로 포맷 (카드/표시용) */
export function formatPrice(value: number): string {
  if (value >= 10000) {
    const eok = Math.floor(value / 10000);
    const remainder = Math.round(value % 10000);
    if (remainder === 0) return `${eok}억`;
    return `${eok}억 ${remainder.toLocaleString()}만`;
  }
  return `${value.toLocaleString()}만`;
}

/** 가격을 "1.5억" 형태로 포맷 (차트 축 라벨용) */
export function formatPriceCompact(value: number): string {
  if (value >= 10000) {
    const eok = value / 10000;
    return eok % 1 === 0 ? `${eok}억` : `${eok.toFixed(1)}억`;
  }
  return `${value.toLocaleString()}만`;
}

/** "2026-03-15" → "2026.03.15" */
export function formatDate(value: string): string {
  return value.replaceAll("-", ".");
}
