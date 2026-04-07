"""
transactions.csv 데이터 정제:
1. 평당가 이상치 제거 (매매 기준 1,000~15,000 만원/평 범위 밖)
2. 중복 행 제거
"""

import pandas as pd
import os

BASE_DIR = os.path.join(os.path.dirname(__file__), "..")
CSV_PATH = os.path.join(BASE_DIR, "data", "transactions.csv")

def main():
    df = pd.read_csv(CSV_PATH, encoding="utf-8-sig")
    original_count = len(df)
    print(f"원본: {original_count:,}건\n")

    # ── 1. 중복 행 제거 ──
    before_dedup = len(df)
    df = df.drop_duplicates()
    dedup_removed = before_dedup - len(df)
    print(f"[중복 제거] {dedup_removed:,}건 제거")

    # ── 2. 평당가 이상치 제거 ──
    df["area"] = pd.to_numeric(df["area"], errors="coerce")
    df["price"] = pd.to_numeric(df["price"], errors="coerce")
    df = df.dropna(subset=["area", "price"])
    df = df[df["area"] > 0]

    df["price_per_pyeong"] = df["price"] / df["area"] * 3.3

    # 매매: 평당가 1,000~15,000 범위 밖 제거
    trade_mask = df["deal_type"] == "매매"
    trade_outlier = trade_mask & (
        (df["price_per_pyeong"] < 1000) | (df["price_per_pyeong"] > 15000)
    )
    trade_outlier_count = trade_outlier.sum()

    # 전세: 매매보다 범위가 낮으므로 500~10,000 기준
    jeonse_mask = df["deal_type"] == "전세"
    jeonse_outlier = jeonse_mask & (
        (df["price_per_pyeong"] < 500) | (df["price_per_pyeong"] > 10000)
    )
    jeonse_outlier_count = jeonse_outlier.sum()

    outlier_mask = trade_outlier | jeonse_outlier
    total_outlier = outlier_mask.sum()

    print(f"[이상치 제거] 매매 {trade_outlier_count:,}건 + 전세 {jeonse_outlier_count:,}건 = {total_outlier:,}건")

    # 제거되는 행 샘플 출력
    if total_outlier > 0:
        samples = df[outlier_mask].head(10)[["gu", "dong", "apt_name", "area", "price", "deal_type", "price_per_pyeong"]]
        print("\n제거 샘플:")
        print(samples.to_string(index=False))

    df = df[~outlier_mask]

    # 임시 컬럼 제거
    df = df.drop(columns=["price_per_pyeong"])

    # ── 저장 ──
    final_count = len(df)
    removed_total = original_count - final_count
    print(f"\n최종: {final_count:,}건 (총 {removed_total:,}건 제거, {removed_total/original_count*100:.2f}%)")

    df.to_csv(CSV_PATH, index=False, encoding="utf-8-sig")
    print(f"저장 완료: {CSV_PATH}")


if __name__ == "__main__":
    main()
