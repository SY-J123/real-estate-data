"""
transactions.csv → public/data/dashboard.json 집계.

프론트엔드가 Supabase 없이 정적 JSON으로 동작하도록
모든 필터 조합(months × area)별 구별/동별 집계 + 월별 평균을 미리 계산한다.
"""

import json
import os
from datetime import datetime, timedelta

import pandas as pd

BASE_DIR = os.path.join(os.path.dirname(__file__), "..")
CSV_PATH = os.path.join(BASE_DIR, "data", "transactions.csv")
OUT_PATH = os.path.join(BASE_DIR, "public", "data", "dashboard.json")

MONTHS_OPTIONS = [1, 3, 6, 12, 36, 60]
AREA_RANGES = {
    "all": (0, 9999),
    "small": (0, 60),
    "medium": (60, 85),
    "large": (85, 9999),
}


def load_transactions() -> pd.DataFrame:
    df = pd.read_csv(CSV_PATH, encoding="utf-8-sig")
    df["deal_date"] = pd.to_datetime(df["deal_date"], errors="coerce")
    df["price"] = pd.to_numeric(df["price"], errors="coerce")
    df["area"] = pd.to_numeric(df["area"], errors="coerce")
    df = df.dropna(subset=["deal_date", "price", "area"])
    df = df[df["area"] > 0]
    df["price_per_pyeong"] = df["price"] / df["area"] * 3.3
    return df


def date_months_ago(months: int) -> datetime:
    now = datetime.now()
    y = now.year
    m = now.month - months
    while m <= 0:
        m += 12
        y -= 1
    return datetime(y, m, 1)


def filter_by_period_and_area(df: pd.DataFrame, months: int, area: str) -> pd.DataFrame:
    from_date = date_months_ago(months)
    amin, amax = AREA_RANGES[area]
    mask = (
        (df["deal_date"] >= from_date)
        & (df["area"] >= amin)
        & (df["area"] < amax)
    )
    return df[mask]


def compute_district_summary(
    df_cur: pd.DataFrame, df_prev: pd.DataFrame
) -> list[dict]:
    """구별 집계: 현재 기간 vs 이전 기간."""
    trades_cur = df_cur[df_cur["deal_type"] == "매매"]
    trades_prev = df_prev[df_prev["deal_type"] == "매매"]
    jeonse_cur = df_cur[df_cur["deal_type"] == "전세"]
    jeonse_prev = df_prev[df_prev["deal_type"] == "전세"]

    # 매매 집계 (평당가 기준)
    cur_agg = trades_cur.groupby("gu").agg(
        avgPrice=("price_per_pyeong", "mean"),
        transactionCount=("price_per_pyeong", "count"),
    )
    prev_agg = trades_prev.groupby("gu").agg(
        prevAvgPrice=("price_per_pyeong", "mean"),
    )

    # 전세 집계 (평당가 기준)
    j_cur_agg = jeonse_cur.groupby("gu")["price_per_pyeong"].mean().rename("avgJeonsePrice")
    j_prev_agg = jeonse_prev.groupby("gu")["price_per_pyeong"].mean().rename("prevAvgJeonsePrice")

    merged = cur_agg.join(prev_agg, how="left").join(j_cur_agg, how="left").join(j_prev_agg, how="left")
    merged = merged.fillna(0)

    result = []
    for gu, row in merged.iterrows():
        avg = round(row["avgPrice"])
        prev = round(row["prevAvgPrice"])
        change = round((avg - prev) / prev * 100, 1) if prev > 0 else 0
        j_avg = round(row["avgJeonsePrice"])
        j_prev = round(row["prevAvgJeonsePrice"])
        j_change = round((j_avg - j_prev) / j_prev * 100, 1) if j_prev > 0 else 0

        result.append({
            "gu": gu,
            "avgPrice": avg,
            "prevAvgPrice": prev,
            "changeRate": change,
            "transactionCount": int(row["transactionCount"]),
            "avgJeonsePrice": j_avg,
            "prevAvgJeonsePrice": j_prev,
            "jeonseChangeRate": j_change,
        })

    return sorted(result, key=lambda x: x["gu"])


def compute_dong_summary(
    df_cur: pd.DataFrame, df_prev: pd.DataFrame
) -> list[dict]:
    """동별 집계."""
    trades_cur = df_cur[df_cur["deal_type"] == "매매"]
    trades_prev = df_prev[df_prev["deal_type"] == "매매"]
    jeonse_cur = df_cur[df_cur["deal_type"] == "전세"]
    jeonse_prev = df_prev[df_prev["deal_type"] == "전세"]

    cur_agg = trades_cur.groupby(["gu", "dong"]).agg(
        avgPrice=("price_per_pyeong", "mean"),
        transactionCount=("price_per_pyeong", "count"),
    )
    prev_agg = trades_prev.groupby(["gu", "dong"]).agg(
        prevAvgPrice=("price_per_pyeong", "mean"),
    )
    j_cur_agg = jeonse_cur.groupby(["gu", "dong"])["price_per_pyeong"].mean().rename("avgJeonsePrice")
    j_prev_agg = jeonse_prev.groupby(["gu", "dong"])["price_per_pyeong"].mean().rename("prevAvgJeonsePrice")

    merged = cur_agg.join(prev_agg, how="left").join(j_cur_agg, how="left").join(j_prev_agg, how="left")
    merged = merged.fillna(0)

    result = []
    for (gu, dong), row in merged.iterrows():
        avg = round(row["avgPrice"])
        prev = round(row["prevAvgPrice"])
        change = round((avg - prev) / prev * 100, 1) if prev > 0 else 0
        j_avg = round(row["avgJeonsePrice"])
        j_prev = round(row["prevAvgJeonsePrice"])
        j_change = round((j_avg - j_prev) / j_prev * 100, 1) if j_prev > 0 else 0

        result.append({
            "gu": gu,
            "dong": dong,
            "avgPrice": avg,
            "prevAvgPrice": prev,
            "changeRate": change,
            "transactionCount": int(row["transactionCount"]),
            "avgJeonsePrice": j_avg,
            "prevAvgJeonsePrice": j_prev,
            "jeonseChangeRate": j_change,
        })

    return sorted(result, key=lambda x: (x["gu"], x["dong"]))


def compute_monthly_avg(df: pd.DataFrame, months: int) -> list[dict]:
    """월별 서울 전체 평균 매매 평당가 + 거래량."""
    from_date = date_months_ago(months)
    trades = df[(df["deal_type"] == "매매") & (df["deal_date"] >= from_date)].copy()
    if trades.empty:
        return []

    trades["month"] = trades["deal_date"].dt.strftime("%Y-%m")
    monthly = trades.groupby("month").agg(
        avgPrice=("price_per_pyeong", "mean"),
        count=("price_per_pyeong", "count"),
    ).sort_index()

    return [
        {"month": m, "avgPrice": round(row["avgPrice"]), "count": int(row["count"])}
        for m, row in monthly.iterrows()
    ]


def main():
    print("=== 대시보드 정적 JSON 빌드 ===\n")

    df = load_transactions()
    print(f"거래 데이터: {len(df)}건\n")

    dashboard: dict = {
        "lastUpdated": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "districtSummary": {},
        "dongSummary": {},
        "monthlyAvg": {},
    }

    for months in MONTHS_OPTIONS:
        for area in AREA_RANGES:
            key = f"{months}_{area}"

            df_cur = filter_by_period_and_area(df, months, area)
            df_prev = filter_by_period_and_area(df, months * 2, area)
            # prev 기간: months*2 전 ~ months 전
            from_prev = date_months_ago(months * 2)
            to_prev = date_months_ago(months)
            df_prev = df_prev[df_prev["deal_date"] < to_prev]

            dashboard["districtSummary"][key] = compute_district_summary(df_cur, df_prev)
            dashboard["dongSummary"][key] = compute_dong_summary(df_cur, df_prev)

            count_cur = len(df_cur[df_cur["deal_type"] == "매매"])
            print(f"  {key}: 구 {len(dashboard['districtSummary'][key])}개, "
                  f"동 {len(dashboard['dongSummary'][key])}개, 매매 {count_cur}건")

        # 월별 평균은 area 무관 (전체 면적)
        dashboard["monthlyAvg"][str(months)] = compute_monthly_avg(df, months)

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(dashboard, f, ensure_ascii=False, separators=(",", ":"))

    size_kb = os.path.getsize(OUT_PATH) / 1024
    print(f"\n저장 완료: {OUT_PATH} ({size_kb:.1f}KB)")


if __name__ == "__main__":
    main()
