"""
가설 1: 서울 인구 수가 감소하고 있으므로 부동산 가격의 하락이 예상된다.
활용 데이터: 행정안전부_지역별 세대원수별 세대수_20250430
"""

import os

import pandas as pd


def run(df: pd.DataFrame) -> dict:
    csv_path = os.path.join(os.path.dirname(__file__), "..", "..", "data", "seoul_household.csv")
    household = pd.read_csv(csv_path, encoding="utf-8-sig")

    line_charts = []
    panels = [
        ("전체세대", "#000000"),
        ("1인세대", "#e74c3c"),
        ("2인세대", "#3498db"),
        ("3인세대", "#2ecc71"),
        ("4인이상세대", "#f39c12"),
    ]
    for col, color in panels:
        data = []
        for _, row in household.iterrows():
            date_str = f"{int(row['연'])}.{int(row['월']):02d}"
            data.append({"date": date_str, "value": int(row[col])})
        line_charts.append({"title": col, "color": color, "data": data})

    return {
        "id": "h1",
        "title": "서울 인구 수가 감소하고 있으므로 부동산 가격의 하락이 예상된다",
        "description": "인구는 감소 추세이나 전체 세대 수는 오히려 증가하고 있다. "
            "특히 1~3인 세대의 증가가 두드러지며, 4인 이상 세대는 감소 중이다. "
            "따라서 대형 평수보다는 1~3인을 수용 가능한 소형 평수의 강세가 예상된다. "
            "(활용 데이터: 행정안전부_지역별 세대원수별 세대수_20250430)",
        "method": "",
        "result": "rejected",
        "p_value": 0.0,
        "test_stat": 0.0,
        "chart_data": [],
        "details": {
            "chart_type": "line",
            "line_charts": line_charts,
        },
    }
