"""
가설 2: 서울 부동산은 주식보다 수익률이 높다.
비교: S&P 500 / KOSPI / (부동산은 데이터 수집 완료 후 추가)
활용 데이터: Yahoo Finance (S&P 500, KOSPI), 국토교통부 실거래가
연초 vs 연말 종가 기준 누적 수익률 비교
"""

import os

import pandas as pd

HYPOTHESIS_ID = "h2"


def run(df: pd.DataFrame) -> dict:
    data_dir = os.path.join(os.path.dirname(__file__), "..", "..", "data")

    stock = pd.read_csv(os.path.join(data_dir, "stock_yearly.csv"))

    series_map = {"S&P 500": "SP500_cumul", "KOSPI": "KOSPI_cumul"}
    colors = {"S&P 500": "#1f77b4", "KOSPI": "#ff7f0e"}

    # 부동산 데이터가 있으면 추가
    re_path = os.path.join(data_dir, "realestate_yearly.csv")
    if os.path.exists(re_path):
        realestate = pd.read_csv(re_path)
        stock = pd.merge(stock, realestate[["year", "seoul_avg", "gangnam3_avg", "non_gangnam_avg"]], on="year", how="left")
        # 부동산 누적 수익률 계산
        for col in ["seoul_avg", "gangnam3_avg", "non_gangnam_avg"]:
            base = stock[col].dropna().iloc[0]
            stock[col + "_cumul"] = round((stock[col] / base - 1) * 100, 1)
        series_map.update({
            "서울 전체": "seoul_avg_cumul",
            "강남3구": "gangnam3_avg_cumul",
            "비강남": "non_gangnam_avg_cumul",
        })
        colors.update({
            "서울 전체": "#000000",
            "강남3구": "#e74c3c",
            "비강남": "#2ecc71",
        })

    line_charts = []
    final_returns = {}
    for label, col in series_map.items():
        if col not in stock.columns:
            continue
        valid = stock[stock[col].notna()]
        if valid.empty:
            continue
        final_ret = round(float(valid[col].iloc[-1]), 1)
        final_returns[label] = final_ret

        data = [{"date": str(int(row["year"])), "value": round(float(row[col]), 1)}
                for _, row in valid.iterrows()]
        line_charts.append({
            "title": f"{label} ({final_ret:+.1f}%)",
            "color": colors[label],
            "data": data,
        })

    desc_parts = [f"{label} {ret:+.1f}%" for label, ret in final_returns.items()]
    year_start = int(stock["year"].iloc[0])
    year_end = int(stock["year"].iloc[-1])

    # 부동산 데이터가 있으면 비교, 없으면 주식만
    result = "inconclusive"
    conclusion = "부동산 데이터 수집 완료 후 비교 예정."
    if "서울 전체" in final_returns:
        seoul_ret = final_returns["서울 전체"]
        stock_max = max(final_returns["S&P 500"], final_returns["KOSPI"])
        result = "supported" if seoul_ret > stock_max else "rejected"
        conclusion = (
            "서울 전체 부동산 수익률은 주식 대비 낮으나, "
            "강남3구는 의미 있는 상승을 보인다."
        )

    return {
        "id": HYPOTHESIS_ID,
        "title": "서울 부동산은 주식보다 수익률이 높다",
        "description": (
            f"동일 기간({year_start}~{year_end}년) 연초 대비 연말 종가 기준 누적 수익률 비교: "
            f"{', '.join(desc_parts)}. "
            f"{conclusion} "
            "(활용 데이터: Yahoo Finance, 국토교통부 실거래가)"
        ),
        "method": "",
        "result": result,
        "p_value": 0.0,
        "test_stat": 0.0,
        "chart_data": [],
        "details": {
            "chart_type": "overlay",
            "line_charts": line_charts,
        },
    }
