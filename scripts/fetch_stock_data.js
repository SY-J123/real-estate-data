/**
 * Yahoo Finance에서 S&P 500, KOSPI 월별 종가를 수집해 data/stock_monthly.csv에 저장한다.
 * 기간: 2021-01 ~ 현재
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

const OUT_PATH = path.join(__dirname, "..", "data", "stock_monthly.csv");

// Yahoo Finance chart API - monthly interval
function fetchYahoo(symbol, period1, period2) {
  return new Promise((resolve, reject) => {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${period1}&period2=${period2}&interval=1mo`;
    https.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          const result = json.chart?.result?.[0];
          if (!result) {
            reject(new Error(`No data for ${symbol}: ${data.substring(0, 200)}`));
            return;
          }
          const timestamps = result.timestamp || [];
          const closes = result.indicators?.quote?.[0]?.close || [];
          const rows = [];
          for (let i = 0; i < timestamps.length; i++) {
            if (closes[i] == null) continue;
            const d = new Date(timestamps[i] * 1000);
            const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            rows.push({ month, close: closes[i] });
          }
          resolve(rows);
        } catch (e) {
          reject(e);
        }
      });
    }).on("error", reject);
  });
}

async function main() {
  // 2021-01-01 ~ now
  const period1 = Math.floor(new Date("2021-01-01").getTime() / 1000);
  const period2 = Math.floor(Date.now() / 1000);

  console.log("S&P 500 수집 중...");
  const sp500 = await fetchYahoo("^GSPC", period1, period2);
  console.log(`  ${sp500.length}개월`);

  console.log("KOSPI 수집 중...");
  const kospi = await fetchYahoo("^KS11", period1, period2);
  console.log(`  ${kospi.length}개월`);

  // 병합 (month 기준)
  const sp500Map = Object.fromEntries(sp500.map((r) => [r.month, r.close]));
  const kospiMap = Object.fromEntries(kospi.map((r) => [r.month, r.close]));
  const allMonths = [...new Set([...sp500.map((r) => r.month), ...kospi.map((r) => r.month)])].sort();

  const lines = ["date,SP500,KOSPI"];
  for (const m of allMonths) {
    const s = sp500Map[m] ?? "";
    const k = kospiMap[m] ?? "";
    if (s && k) {
      lines.push(`${m}-01,${Number(s).toFixed(2)},${Number(k).toFixed(2)}`);
    }
  }

  fs.writeFileSync(OUT_PATH, lines.join("\n") + "\n", "utf-8");
  console.log(`\n저장: ${OUT_PATH} (${lines.length - 1}개월)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
