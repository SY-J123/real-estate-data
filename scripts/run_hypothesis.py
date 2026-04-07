"""
가설 검정 러너.

각 가설 모듈(hypotheses/)의 run() 을 실행하고 결과를 Supabase hypotheses 테이블에 저장한다.
"""

import os
import sys
import json
from datetime import datetime

import pandas as pd
from supabase import create_client

from hypotheses import ALL as HYPOTHESIS_MODULES

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")


def get_supabase():
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def load_transactions() -> pd.DataFrame:
    """Supabase에서 전체 거래 데이터를 로드한다."""
    sb = get_supabase()
    all_data = []
    offset = 0
    batch = 1000

    while True:
        resp = sb.table("transactions").select("*").range(offset, offset + batch - 1).execute()
        rows = resp.data
        if not rows:
            break
        all_data.extend(rows)
        offset += batch

    df = pd.DataFrame(all_data)
    if not df.empty:
        df["deal_date"] = pd.to_datetime(df["deal_date"])
        df["price"] = pd.to_numeric(df["price"], errors="coerce")
        df["area"] = pd.to_numeric(df["area"], errors="coerce")
        df["build_year"] = pd.to_numeric(df["build_year"], errors="coerce")
    return df


def cleanup_stale(valid_ids: list[str]) -> None:
    """ALL 목록에 없는 가설을 삭제한다."""
    sb = get_supabase()
    resp = sb.table("hypotheses").select("id").execute()
    existing = {row["id"] for row in resp.data}
    stale = existing - set(valid_ids)
    for sid in stale:
        sb.table("hypotheses").delete().eq("id", sid).execute()
    if stale:
        print(f"임시 가설 {len(stale)}건 삭제: {stale}")


def save_results(results: list[dict]) -> None:
    """검정 결과를 Supabase에 저장한다."""
    sb = get_supabase()
    for r in results:
        sb.table("hypotheses").upsert({
            "id": r["id"],
            "title": r["title"],
            "description": r["description"],
            "method": r["method"],
            "result": r["result"],
            "p_value": r["p_value"],
            "test_stat": r["test_stat"],
            "chart_data": json.dumps(r["chart_data"]),
            "details": json.dumps(r["details"]),
            "analyzed_at": datetime.now().isoformat(),
        }, on_conflict="id").execute()

    print(f"가설 검정 결과 {len(results)}건 저장 완료")


def main():
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("ERROR: SUPABASE_URL / SUPABASE_SERVICE_KEY 환경변수가 설정되지 않았습니다.")
        sys.exit(1)

    print("=== 가설 검정 시작 ===\n")

    df = load_transactions()
    print(f"로드된 거래 데이터: {len(df)}건\n")

    valid_ids = [mod.HYPOTHESIS_ID for mod in HYPOTHESIS_MODULES]
    cleanup_stale(valid_ids)

    results = [mod.run(df) for mod in HYPOTHESIS_MODULES]

    for r in results:
        symbol = "O" if r["result"] == "supported" else ("?" if r["result"] == "inconclusive" else "X")
        print(f"  [{symbol}] {r['title']} (p={r['p_value']:.4f})")

    print()
    save_results(results)


if __name__ == "__main__":
    main()
