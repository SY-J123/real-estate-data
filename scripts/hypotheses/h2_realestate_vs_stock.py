"""
가설 2: 서울 부동산은 주식보다 수익률이 높다.
비교: S&P 500 / KOSPI vs 서울 아파트 매매가지수 (지역별 + 면적별)
활용 데이터: Yahoo Finance (S&P 500, KOSPI), 국토교통부 실거래가
기준월(2021-01) = 100 으로 환산한 지수 비교
"""

import os

import pandas as pd

HYPOTHESIS_ID = "h2"

GANGNAM3 = {"강남구", "서초구", "송파구"}

AREA_BINS = [
    ("소형 (~60㎡)", 0, 60),
    ("중형 (60~85㎡)", 60, 85),
    ("대형 (85㎡~)", 85, 9999),
]

REGION_COLORS = {
    "서울 전체": "#000000",
    "강남3구": "#e74c3c",
    "비강남": "#2ecc71",
}

AREA_COLORS = {
    "소형 (~60㎡)": "#e74c3c",
    "중형 (60~85㎡)": "#3498db",
    "대형 (85㎡~)": "#2ecc71",
}

STOCK_COLORS = {
    "S&P 500": "#1f77b4",
    "KOSPI": "#ff7f0e",
}


def _to_index(series: pd.Series) -> pd.Series:
    """첫 값을 100으로 놓은 지수로 변환한다."""
    base = series.iloc[0]
    if base == 0:
        return series * 0
    return round(series / base * 100, 1)


def _build_stock_index(data_dir: str) -> pd.DataFrame:
    """월별 주식 지수를 base=100으로 환산한다."""
    path = os.path.join(data_dir, "stock_monthly.csv")
    stock = pd.read_csv(path)
    stock["date"] = pd.to_datetime(stock["date"])
    stock["month"] = stock["date"].dt.to_period("M")
    stock = stock.sort_values("month")

    result = pd.DataFrame({"month": stock["month"]})
    result["S&P 500"] = _to_index(stock["SP500"].reset_index(drop=True))
    result["KOSPI"] = _to_index(stock["KOSPI"].reset_index(drop=True))
    return result


def _build_region_index(df: pd.DataFrame) -> pd.DataFrame:
    """지역별 월별 매매가지수 (서울전체 / 강남3구 / 비강남)."""
    trades = df[(df["deal_type"] == "매매") & (df["area"] < 135)].copy()
    if trades.empty:
        return pd.DataFrame()

    trades["month"] = trades["deal_date"].dt.to_period("M")
    trades["region"] = trades["gu"].apply(
        lambda g: "강남3구" if g in GANGNAM3 else "비강남"
    )

    # 서울 전체
    seoul = trades.groupby("month")["price"].mean().sort_index()
    # 강남3구 / 비강남
    region_avg = trades.groupby(["month", "region"])["price"].mean().unstack(fill_value=0).sort_index()

    result = pd.DataFrame({"month": seoul.index})
    result["서울 전체"] = _to_index(seoul.reset_index(drop=True))
    for col in ["강남3구", "비강남"]:
        if col in region_avg.columns:
            s = region_avg[col].reindex(seoul.index, fill_value=0)
            result[col] = _to_index(s.reset_index(drop=True))
    return result


def _build_area_index(df: pd.DataFrame) -> pd.DataFrame:
    """면적별 월별 매매가지수 (소형 / 중형 / 대형)."""
    trades = df[df["deal_type"] == "매매"].copy()
    if trades.empty:
        return pd.DataFrame()

    trades["month"] = trades["deal_date"].dt.to_period("M")

    # 전체 월 기준
    all_months = trades.groupby("month")["price"].mean().sort_index()
    result = pd.DataFrame({"month": all_months.index})

    for label, area_min, area_max in AREA_BINS:
        subset = trades[(trades["area"] >= area_min) & (trades["area"] < area_max)]
        if subset.empty:
            continue
        monthly = subset.groupby("month")["price"].mean().sort_index()
        monthly = monthly.reindex(all_months.index)
        # 결측 보간
        monthly = monthly.interpolate(method="linear").bfill().ffill()
        result[label] = _to_index(monthly.reset_index(drop=True))

    return result


def _merge_and_build_charts(
    stock_df: pd.DataFrame,
    realestate_df: pd.DataFrame,
    re_colors: dict,
) -> list[dict]:
    """주식 지수 + 부동산 지수를 병합하여 line_charts 리스트를 만든다."""
    if realestate_df.empty:
        return []

    merged = pd.merge(stock_df, realestate_df, on="month", how="inner")
    if merged.empty:
        return []

    merged = merged.sort_values("month")

    # 병합 후 주식도 첫 행 기준으로 재조정 (기간 맞춤)
    for col in ["S&P 500", "KOSPI"]:
        base = merged[col].iloc[0]
        if base > 0:
            merged[col] = round(merged[col] / base * 100, 1)

    # 부동산도 첫 행 기준 재조정
    for col in re_colors:
        if col in merged.columns:
            base = merged[col].iloc[0]
            if base > 0:
                merged[col] = round(merged[col] / base * 100, 1)

    all_colors = {**STOCK_COLORS, **re_colors}
    charts = []
    for label, color in all_colors.items():
        if label not in merged.columns:
            continue
        data = [
            {"date": str(row["month"]), "value": float(row[label])}
            for _, row in merged.iterrows()
        ]
        final_val = round(float(merged[label].iloc[-1]) - 100, 1)
        charts.append({
            "title": f"{label} ({final_val:+.1f}%)",
            "color": color,
            "data": data,
        })

    return charts


def run(df: pd.DataFrame) -> dict:
    data_dir = os.path.join(os.path.dirname(__file__), "..", "..", "data")

    stock_df = _build_stock_index(data_dir)
    region_df = _build_region_index(df)
    area_df = _build_area_index(df)

    region_charts = _merge_and_build_charts(stock_df, region_df, REGION_COLORS)
    area_charts = _merge_and_build_charts(stock_df, area_df, AREA_COLORS)

    # 결론 도출
    result = "inconclusive"
    conclusion = "부동산 거래 데이터가 부족하여 비교가 어렵습니다."

    if region_charts:
        # 최종 수익률 추출
        final_returns = {}
        for chart in region_charts:
            label = chart["title"].split(" (")[0]
            val = chart["data"][-1]["value"] - 100
            final_returns[label] = round(val, 1)

        seoul_ret = final_returns.get("서울 전체", 0)
        sp500_ret = final_returns.get("S&P 500", 0)
        kospi_ret = final_returns.get("KOSPI", 0)
        gangnam_ret = final_returns.get("강남3구", 0)
        stock_max = max(sp500_ret, kospi_ret)

        if seoul_ret > stock_max:
            result = "supported"
        else:
            result = "rejected"

        parts = [f"{k} {v:+.1f}%" for k, v in final_returns.items()]
        conclusion = (
            f"동일 기간 누적 수익률: {', '.join(parts)}. "
        )
        if gangnam_ret > stock_max:
            conclusion += "서울 전체는 주식 대비 저조하나, 강남3구는 주식을 상회하는 수익률을 보인다."
        elif seoul_ret > stock_max:
            conclusion += "서울 부동산이 주식 대비 높은 수익률을 기록했다."
        else:
            conclusion += "서울 부동산 수익률은 주식(특히 S&P 500) 대비 저조하다."

    return {
        "id": HYPOTHESIS_ID,
        "title": "서울 부동산은 주식보다 수익률이 높다",
        "description": (
            f"월별 매매가지수(기준월=100)와 주식지수를 동일 기간 비교. {conclusion} "
            "(활용 데이터: Yahoo Finance, 국토교통부 실거래가)"
        ),
        "method": "매매가지수 추세 비교 (지역별 + 면적별)",
        "result": result,
        "p_value": 0.0,
        "test_stat": 0.0,
        "chart_data": [],
        "details": {
            "chart_type": "multi_overlay",
            "chart_groups": [
                {
                    "title": "지역별 매매가지수 vs 주식지수",
                    "line_charts": region_charts,
                },
                {
                    "title": "면적별 매매가지수 vs 주식지수",
                    "line_charts": area_charts,
                },
            ],
        },
    }
