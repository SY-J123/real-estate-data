"""
가설 검정 러너.

각 가설 모듈(hypotheses/)의 run() 을 실행하고 결과를 public/data/hypotheses.json에 저장한다.
DB 의존 없이 로컬 CSV에서 데이터를 로드한다.
"""

import json
import os
import sys

import pandas as pd

from hypotheses import ALL as HYPOTHESIS_MODULES

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
CSV_PATH = os.path.join(DATA_DIR, "transactions.csv")
OUT_PATH = os.path.join(os.path.dirname(__file__), "..", "public", "data", "hypotheses.json")


def load_transactions() -> pd.DataFrame:
    """로컬 CSV에서 거래 데이터를 로드한다."""
    if not os.path.exists(CSV_PATH):
        print(f"ERROR: {CSV_PATH} 파일이 없습니다.")
        print("먼저 scripts/export_transactions.py 를 실행하세요.")
        sys.exit(1)

    df = pd.read_csv(CSV_PATH, encoding="utf-8-sig")
    if not df.empty:
        df["deal_date"] = pd.to_datetime(df["deal_date"], errors="coerce")
        df["price"] = pd.to_numeric(df["price"], errors="coerce")
        df["area"] = pd.to_numeric(df["area"], errors="coerce")
        df["build_year"] = pd.to_numeric(df["build_year"], errors="coerce")
    return df


def save_results(results: list[dict]) -> None:
    """검정 결과를 정적 JSON 파일로 저장한다."""
    # 프론트엔드 Hypothesis 타입에 맞게 변환
    output = []
    for r in results:
        details = r.get("details", {})
        entry = {
            "id": r["id"],
            "title": r["title"],
            "description": r["description"],
            "method": r["method"],
            "result": r["result"],
            "pValue": r["p_value"],
            "testStat": r["test_stat"],
            "chartData": r.get("chart_data", []),
            "chartType": details.get("chart_type", "bar"),
        }
        # lineCharts (단일 그룹)
        if "line_charts" in details:
            entry["lineCharts"] = details["line_charts"]
        # chartGroups (다중 그룹)
        if "chart_groups" in details:
            entry["chartGroups"] = [
                {"title": g["title"], "lineCharts": g["line_charts"]}
                for g in details["chart_groups"]
            ]
        entry["details"] = {
            k: v for k, v in details.items()
            if k not in ("chart_type", "line_charts", "chart_groups")
        }
        output.append(entry)

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    size_kb = os.path.getsize(OUT_PATH) / 1024
    print(f"결과 저장: {OUT_PATH} ({size_kb:.1f}KB)")


def main():
    print("=== 가설 검정 시작 ===\n")

    df = load_transactions()
    print(f"로드된 거래 데이터: {len(df)}건\n")

    results = [mod.run(df) for mod in HYPOTHESIS_MODULES]

    for r in results:
        symbol = "O" if r["result"] == "supported" else ("?" if r["result"] == "inconclusive" else "X")
        print(f"  [{symbol}] {r['title']} (p={r['p_value']:.4f})")

    print()
    save_results(results)


if __name__ == "__main__":
    main()
