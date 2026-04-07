"""
가설 1: 서울 인구 수가 감소하고 있으므로 부동산 가격의 하락이 예상된다.
활용 데이터: 행정안전부_지역별 세대원수별 세대수_20250430
"""

import os

import pandas as pd

HYPOTHESIS_ID = "h1"


def _build_household_charts() -> list[dict]:
    """세대원수별 세대 수 추이 (시작점 = 100 지수)."""
    csv_path = os.path.join(os.path.dirname(__file__), "..", "..", "data", "seoul_household.csv")
    household = pd.read_csv(csv_path, encoding="utf-8-sig")

    panels = [
        ("전체세대", "#000000"),
        ("1인세대", "#e74c3c"),
        ("2인세대", "#3498db"),
        ("3인세대", "#2ecc71"),
        ("4인이상세대", "#f39c12"),
    ]
    charts = []
    for col, color in panels:
        values = household[col]
        indexed = values / values.iloc[0] * 100  # 시작점 = 100
        data = []
        for i, row in household.iterrows():
            date_str = f"{int(row['연'])}.{int(row['월']):02d}"
            data.append({"date": date_str, "value": round(float(indexed.iloc[i]), 1)})
        charts.append({"title": col, "color": color, "data": data})
    return charts


def run(df: pd.DataFrame) -> dict:
    household_charts = _build_household_charts()

    return {
        "id": "h1",
        "title": "서울 인구 수가 감소하고 있으므로 부동산 가격의 하락이 예상된다",
        "description": (
            "인구는 감소 추세이나 전체 세대 수는 오히려 증가하고 있다. "
            "특히 1~2인 세대의 증가가 두드러지며, 4인 이상 세대는 감소 중이다. "
            "주거 수요의 총량은 줄지 않으며, 1~2인 가구 중심의 수요는 계속 늘어날 것으로 예상된다. "
            "(활용 데이터: 행정안전부_세대원수별 세대수)"
        ),
        "method": "추세 분석 (세대 구조 변화)",
        "result": "rejected",
        "p_value": 0.0,
        "test_stat": 0.0,
        "chart_data": [],
        "details": {
            "chart_type": "overlay",
            "line_charts": household_charts,
        },
    }
