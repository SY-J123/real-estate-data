"""
transactions.csv의 구-월 누락 여부를 빠르게 확인한다.

예시:
  python scripts/validate_transactions_coverage.py
  python scripts/validate_transactions_coverage.py 2025-10 2026-03
"""

from __future__ import annotations

import sys
from pathlib import Path

import pandas as pd


BASE_DIR = Path(__file__).resolve().parent.parent
CSV_PATH = BASE_DIR / "data" / "transactions.csv"


def main() -> None:
    start_month = sys.argv[1] if len(sys.argv) > 1 else "2025-10"
    end_month = sys.argv[2] if len(sys.argv) > 2 else "2026-03"

    df = pd.read_csv(CSV_PATH, encoding="utf-8-sig")
    df = df[df["deal_type"] == "매매"].copy()
    df["month"] = pd.to_datetime(df["deal_date"], errors="coerce").dt.strftime("%Y-%m")
    df = df.dropna(subset=["month"])

    months = sorted(df["month"].unique())
    months = [month for month in months if start_month <= month <= end_month]
    gus = sorted(df["gu"].dropna().unique())

    print(f"검사 구간: {start_month} ~ {end_month}")
    for month in months:
        present = set(df.loc[df["month"] == month, "gu"])
        missing = [gu for gu in gus if gu not in present]
        print(f"{month}: 누락 {len(missing)}개", end="")
        if missing:
            print(" -> " + ", ".join(missing))
        else:
            print()


if __name__ == "__main__":
    main()
