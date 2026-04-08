/**
 * 가설 2: 서울 부동산은 주식보다 수익률이 높다
 * transactions.csv + stock_monthly.csv → hypotheses.json 의 h2 항목 갱신
 */

const fs = require("fs");
const path = require("path");

const BASE = path.resolve(__dirname, "..");
const TX_PATH = path.join(BASE, "data", "transactions.csv");
const STOCK_PATH = path.join(BASE, "data", "stock_monthly.csv");
const HYP_PATH = path.join(BASE, "public", "data", "hypotheses.json");

const GANGNAM3 = new Set(["강남구", "서초구", "송파구"]);

const AREA_BINS = [
  ["소형 (~60㎡)", 0, 60],
  ["중형 (60~85㎡)", 60, 85],
  ["대형 (85㎡~)", 85, 9999],
];

const REGION_COLORS = { "서울 전체": "#000000", "강남3구": "#e74c3c", 비강남: "#2ecc71" };
const AREA_COLORS = { "소형 (~60㎡)": "#e74c3c", "중형 (60~85㎡)": "#3498db", "대형 (85㎡~)": "#2ecc71" };
const STOCK_COLORS = { "S&P 500": "#1f77b4", KOSPI: "#ff7f0e" };

function readTx() {
  const text = fs.readFileSync(TX_PATH, "utf-8");
  const lines = text.split("\n");
  const header = lines[0].replace(/^\uFEFF/, "").split(",").map((h) => h.trim());
  const idx = {};
  header.forEach((h, i) => (idx[h] = i));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const cols = lines[i].split(",").map((c) => c.trim());
    if (cols[idx["deal_type"]] !== "매매") continue;
    const area = parseFloat(cols[idx["area"]]) || 0;
    const price = parseInt(cols[idx["price"]]) || 0;
    const date = cols[idx["deal_date"]] || "";
    const month = date.substring(0, 7);
    if (!month || area <= 0 || price <= 0) continue;
    const ppp = price / area * 3.3; // 평당가
    rows.push({ gu: cols[idx["gu"]], month, area, price, ppp });
  }
  return rows;
}

function readStock() {
  const text = fs.readFileSync(STOCK_PATH, "utf-8");
  const lines = text.split("\n").filter((l) => l.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const [date, sp500, kospi] = lines[i].split(",");
    rows.push({
      month: date.substring(0, 7),
      SP500: parseFloat(sp500),
      KOSPI: parseFloat(kospi),
    });
  }
  return rows.sort((a, b) => a.month.localeCompare(b.month));
}

function mean(arr) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

function toIndex(values) {
  const base = values[0];
  if (!base) return values.map(() => 0);
  return values.map((v) => Math.round((v / base) * 1000) / 10);
}

function buildRegionIndex(txRows) {
  const byMonth = {};
  for (const r of txRows) {
    if (r.area < 59 || r.area > 85) continue; // 국민평수(59~85㎡)만
    if (!byMonth[r.month]) byMonth[r.month] = { all: [], gangnam: [], other: [] };
    byMonth[r.month].all.push(r.ppp);
    if (GANGNAM3.has(r.gu)) byMonth[r.month].gangnam.push(r.ppp);
    else byMonth[r.month].other.push(r.ppp);
  }
  const months = Object.keys(byMonth).sort();
  return {
    months,
    "서울 전체": months.map((m) => mean(byMonth[m].all)),
    강남3구: months.map((m) => mean(byMonth[m].gangnam)),
    비강남: months.map((m) => mean(byMonth[m].other)),
  };
}

function buildAreaIndex(txRows) {
  const byMonth = {};
  for (const r of txRows) {
    if (!byMonth[r.month]) byMonth[r.month] = {};
    for (const [label, min, max] of AREA_BINS) {
      if (r.area >= min && r.area < max) {
        if (!byMonth[r.month][label]) byMonth[r.month][label] = [];
        byMonth[r.month][label].push(r.ppp);
      }
    }
  }
  const months = Object.keys(byMonth).sort();
  const result = { months };
  for (const [label] of AREA_BINS) {
    result[label] = months.map((m) => mean(byMonth[m]?.[label] || []));
  }
  return result;
}

function mergeAndBuildCharts(stockRows, reIndex, reColors) {
  const stockMap = {};
  for (const s of stockRows) stockMap[s.month] = s;

  // 교집합 월
  const months = reIndex.months.filter((m) => stockMap[m]);
  if (months.length === 0) return [];

  // 주식 지수
  const sp500Vals = months.map((m) => stockMap[m].SP500);
  const kospiVals = months.map((m) => stockMap[m].KOSPI);
  const sp500Idx = toIndex(sp500Vals);
  const kospiIdx = toIndex(kospiVals);

  // 부동산 지수 (교집합 월 기준)
  const monthSet = new Set(months);
  const reIndices = {};
  for (const label of Object.keys(reColors)) {
    const fullVals = reIndex.months.map((m, i) => [m, reIndex[label][i]]);
    const filtered = fullVals.filter(([m]) => monthSet.has(m)).map(([, v]) => v);
    reIndices[label] = toIndex(filtered);
  }

  const allSeries = {
    "S&P 500": { color: STOCK_COLORS["S&P 500"], values: sp500Idx },
    KOSPI: { color: STOCK_COLORS.KOSPI, values: kospiIdx },
  };
  for (const [label, color] of Object.entries(reColors)) {
    allSeries[label] = { color, values: reIndices[label] };
  }

  const charts = [];
  for (const [label, { color, values }] of Object.entries(allSeries)) {
    const finalVal = Math.round((values[values.length - 1] - 100) * 10) / 10;
    charts.push({
      title: `${label} (${finalVal >= 0 ? "+" : ""}${finalVal}%)`,
      color,
      data: months.map((m, i) => ({ date: m, value: values[i] })),
    });
  }
  return charts;
}

function main() {
  console.log("=== 가설 2 빌드 ===\n");

  const txRows = readTx();
  console.log(`매매 거래: ${txRows.length.toLocaleString()}건`);

  const stockRows = readStock();
  console.log(`주식 데이터: ${stockRows.length}개월\n`);

  const regionIdx = buildRegionIndex(txRows);
  const areaIdx = buildAreaIndex(txRows);

  const regionCharts = mergeAndBuildCharts(stockRows, regionIdx, REGION_COLORS);
  const areaCharts = mergeAndBuildCharts(stockRows, areaIdx, AREA_COLORS);

  // 결론 도출
  let result = "inconclusive";
  let conclusion = "데이터 부족";

  if (regionCharts.length > 0) {
    const finals = {};
    for (const c of regionCharts) {
      const label = c.title.split(" (")[0];
      finals[label] = c.data[c.data.length - 1].value - 100;
    }

    const seoulRet = Math.round((finals["서울 전체"] || 0) * 10) / 10;
    const sp500Ret = Math.round((finals["S&P 500"] || 0) * 10) / 10;
    const kospiRet = Math.round((finals["KOSPI"] || 0) * 10) / 10;
    const gangnamRet = Math.round((finals["강남3구"] || 0) * 10) / 10;
    const stockMax = Math.max(sp500Ret, kospiRet);

    result = seoulRet > stockMax ? "supported" : "rejected";

    const parts = Object.entries(finals).map(
      ([k, v]) => `${k} ${v >= 0 ? "+" : ""}${Math.round(v * 10) / 10}%`
    );
    conclusion = `동일 기간(2021.01~현재) 누적 수익률: ${parts.join(", ")}. `;

    if (gangnamRet > stockMax && seoulRet <= stockMax) {
      conclusion += "서울 전체는 주식 대비 저조하나, 강남3구는 주식을 상회하는 수익률을 보인다.";
    } else if (seoulRet > stockMax) {
      conclusion += "서울 부동산이 주식 대비 높은 수익률을 기록했다.";
    } else {
      conclusion += "서울 부동산 수익률은 주식(특히 S&P 500) 대비 저조하다.";
    }

    console.log("수익률:");
    for (const [k, v] of Object.entries(finals)) {
      console.log(`  ${k}: ${v >= 0 ? "+" : ""}${Math.round(v * 10) / 10}%`);
    }
    console.log(`\n판정: ${result}`);
  }

  // hypotheses.json 업데이트
  const hypotheses = JSON.parse(fs.readFileSync(HYP_PATH, "utf-8"));
  const h2idx = hypotheses.findIndex((h) => h.id === "h2");

  const h2 = {
    id: "h2",
    title: "서울 부동산은 주식보다 수익률이 높다",
    description:
      `국민평수(59~85㎡) 아파트의 월별 평당가지수(기준월=100)와 주식지수를 동일 기간 비교. ${conclusion} ` +
      "(활용 데이터: Yahoo Finance, 국토교통부 실거래가)",
    method: "매매가지수 추세 비교 (지역별 + 면적별)",
    result,
    pValue: 0,
    testStat: 0,
    chartData: [],
    chartType: "multi_overlay",
    chartGroups: [
      { title: "지역별 매매가지수 vs 주식지수", lineCharts: regionCharts },
      { title: "면적별 매매가지수 vs 주식지수", lineCharts: areaCharts },
    ],
    details: {},
  };

  if (h2idx >= 0) hypotheses[h2idx] = h2;
  else hypotheses.push(h2);

  fs.writeFileSync(HYP_PATH, JSON.stringify(hypotheses, null, 2), "utf-8");
  console.log(`\n저장: ${HYP_PATH}`);
}

main();
