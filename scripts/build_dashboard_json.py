"""
transactions.csv → public/data/dashboard.json 집계.

프론트엔드가 Supabase 없이 정적 JSON으로 동작하도록
모든 필터 조합(months × area)별 구별/동별 집계 + 월별 평균을 미리 계산한다.
"""

import json
import os
from datetime import datetime, timedelta

import pandas as pd

from config import BASE_DIR, CSV_PATH, OUTPUT_DIR, MONTHS_OPTIONS, AREA_RANGES

OUT_PATH = os.path.join(OUTPUT_DIR, "dashboard.json")


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

        jeonse_ratio = round(j_avg / avg * 100, 1) if avg > 0 else 0

        result.append({
            "gu": gu,
            "avgPrice": avg,
            "prevAvgPrice": prev,
            "changeRate": change,
            "transactionCount": int(row["transactionCount"]),
            "avgJeonsePrice": j_avg,
            "prevAvgJeonsePrice": j_prev,
            "jeonseChangeRate": j_change,
            "jeonseRatio": jeonse_ratio,
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

        jeonse_ratio = round(j_avg / avg * 100, 1) if avg > 0 else 0

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
            "jeonseRatio": jeonse_ratio,
        })

    return sorted(result, key=lambda x: (x["gu"], x["dong"]))


def compute_monthly_avg(df: pd.DataFrame, months: int) -> list[dict]:
    """월별 서울 전체 평균 매매/전세 평당가 + 거래량."""
    from_date = date_months_ago(months)
    period = df[df["deal_date"] >= from_date].copy()
    if period.empty:
        return []

    period["month"] = period["deal_date"].dt.strftime("%Y-%m")

    trades = period[period["deal_type"] == "매매"]
    jeonse = period[period["deal_type"] == "전세"]

    t_monthly = trades.groupby("month").agg(
        avgPrice=("price_per_pyeong", "mean"),
        count=("price_per_pyeong", "count"),
    )
    j_monthly = jeonse.groupby("month").agg(
        avgJeonsePrice=("price_per_pyeong", "mean"),
        jeonseCount=("price_per_pyeong", "count"),
    )

    monthly = t_monthly.join(j_monthly, how="outer").fillna(0).sort_index()

    result = []
    for m, row in monthly.iterrows():
        avg = round(row["avgPrice"])
        j_avg = round(row["avgJeonsePrice"])
        jeonse_ratio = round(j_avg / avg * 100, 1) if avg > 0 else 0
        result.append({
            "month": m,
            "avgPrice": avg,
            "count": int(row["count"]),
            "avgJeonsePrice": j_avg,
            "jeonseCount": int(row["jeonseCount"]),
            "jeonseRatio": jeonse_ratio,
        })
    return result


def compute_monthly_by_gu(df: pd.DataFrame, months: int) -> dict[str, list[dict]]:
    """구별 월별 평당가/전세가율 추이. {gu: [{month, avgPrice, avgJeonsePrice, jeonseRatio}, ...]}"""
    from_date = date_months_ago(months)
    period = df[df["deal_date"] >= from_date].copy()
    if period.empty:
        return {}

    period["month"] = period["deal_date"].dt.strftime("%Y-%m")

    trades = period[period["deal_type"] == "매매"]
    jeonse = period[period["deal_type"] == "전세"]

    t_agg = trades.groupby(["gu", "month"])["price_per_pyeong"].mean()
    j_agg = jeonse.groupby(["gu", "month"])["price_per_pyeong"].mean()

    result: dict[str, list[dict]] = {}
    for gu in sorted(period["gu"].unique()):
        months_list = []
        t_gu = t_agg.loc[gu] if gu in t_agg.index else pd.Series(dtype=float)
        j_gu = j_agg.loc[gu] if gu in j_agg.index else pd.Series(dtype=float)
        all_months = sorted(set(t_gu.index) | set(j_gu.index))
        for m in all_months:
            avg = round(t_gu.get(m, 0))
            j_avg = round(j_gu.get(m, 0))
            ratio = round(j_avg / avg * 100, 1) if avg > 0 else 0
            months_list.append({
                "month": m,
                "avgPrice": avg,
                "avgJeonsePrice": j_avg,
                "jeonseRatio": ratio,
            })
        result[gu] = months_list

    return result


def main():
    print("=== 대시보드 정적 JSON 빌드 ===\n")

    df = load_transactions()
    print(f"거래 데이터: {len(df)}건\n")

    dashboard: dict = {
        "lastUpdated": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "districtSummary": {},
        "dongSummary": {},
        "monthlyAvg": {},
        "monthlyByGu": {},
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
        dashboard["monthlyByGu"][str(months)] = compute_monthly_by_gu(df, months)

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(dashboard, f, ensure_ascii=False, separators=(",", ":"))

    size_kb = os.path.getsize(OUT_PATH) / 1024
    print(f"\n저장 완료: {OUT_PATH} ({size_kb:.1f}KB)")


if __name__ == "__main__":
    main()
