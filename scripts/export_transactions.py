"""
Supabase transactions 테이블 → CSV 내보내기 (1회성).

중복 제거, 컬럼 정리, 타입 보정 포함.
사용법: python scripts/export_transactions.py
"""

import os
import sys

import pandas as pd
from supabase import create_client

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")

OUT_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "transactions.csv")

COLUMNS = [
    "gu", "dong", "aptName", "area", "floor", "price",
    "deal_date", "build_year", "deal_type",
]


def fetch_all() -> pd.DataFrame:
    sb = create_client(SUPABASE_URL, SUPABASE_KEY)
    rows = []
    offset = 0
    batch = 1000

    while True:
        resp = sb.table("transactions").select("*").range(offset, offset + batch - 1).execute()
        if not resp.data:
            break
        rows.extend(resp.data)
        offset += batch
        print(f"  {offset}건 로드...", end="\r")

    print(f"\n총 {len(rows)}건 로드 완료")
    return pd.DataFrame(rows)


def clean(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        return df

    # 필요한 컬럼만 유지 (id 제거 — CSV에서는 불필요)
    keep = [c for c in COLUMNS if c in df.columns]
    df = df[keep].copy()

    # 타입 보정
    df["price"] = pd.to_numeric(df["price"], errors="coerce")
    df["area"] = pd.to_numeric(df["area"], errors="coerce")
    df["floor"] = pd.to_numeric(df["floor"], errors="coerce")
    df["build_year"] = pd.to_numeric(df["build_year"], errors="coerce")

    # 가격/면적 없는 행 제거
    df = df.dropna(subset=["price", "area"])

    # deal_date 정규화 (YYYY-MM-DD)
    df["deal_date"] = pd.to_datetime(df["deal_date"], errors="coerce").dt.strftime("%Y-%m-%d")
    df = df.dropna(subset=["deal_date"])

    # 문자열 공백 제거
    for col in ["gu", "dong", "aptName", "deal_type"]:
        if col in df.columns:
            df[col] = df[col].astype(str).str.strip()

    # 중복 제거 (동일 거래: 구+동+아파트+면적+층+가격+날짜+거래유형)
    dup_cols = [c for c in COLUMNS if c in df.columns]
    before = len(df)
    df = df.drop_duplicates(subset=dup_cols, keep="first")
    removed = before - len(df)
    if removed:
        print(f"중복 {removed}건 제거")

    # 정렬
    df = df.sort_values(["deal_date", "gu", "dong"], ascending=[False, True, True])
    df = df.reset_index(drop=True)

    return df


def main():
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("ERROR: SUPABASE_URL / SUPABASE_SERVICE_KEY 환경변수 필요")
        sys.exit(1)

    print("=== Supabase → CSV 내보내기 ===\n")

    df = fetch_all()
    df = clean(df)

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    df.to_csv(OUT_PATH, index=False, encoding="utf-8-sig")
    print(f"\n저장 완료: {OUT_PATH} ({len(df)}건, {os.path.getsize(OUT_PATH) / 1024:.1f}KB)")


if __name__ == "__main__":
    main()
