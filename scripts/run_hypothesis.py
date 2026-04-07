"""
가설 검정 스크립트.

Supabase에 저장된 거래 데이터를 기반으로 부동산 통설을 통계적으로 검증하고
결과를 hypotheses 테이블에 저장한다.

검정 방법:
  - 독립표본 t-검정 (두 그룹 비교)
  - 일원분산분석 ANOVA (3개 이상 그룹 비교)
  - 피어슨 상관분석 (연속 변수 간 관계)
"""

import os
import sys
import json
from datetime import datetime

import pandas as pd
from scipy import stats
from supabase import create_client

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")

SIGNIFICANCE_LEVEL = 0.05


def get_supabase():
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def load_transactions() -> pd.DataFrame:
    """Supabase에서 전체 거래 데이터를 로드한다."""
    sb = get_supabase()
    # 페이지네이션으로 전체 데이터 로드
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


def determine_result(p_value: float) -> str:
    if p_value < SIGNIFICANCE_LEVEL:
        return "supported"
    elif p_value < 0.1:
        return "inconclusive"
    else:
        return "rejected"


# ═══════════════════════════════════════════
# 가설 1: 강남3구는 비강남3구보다 가격 상승률이 높다
# ═══════════════════════════════════════════
def hypothesis_gangnam(df: pd.DataFrame) -> dict:
    """독립표본 t-검정으로 강남3구 vs 나머지 가격 비교."""
    gangnam = {"강남구", "서초구", "송파구"}

    sales = df[df["deal_type"] == "매매"].copy()
    if sales.empty:
        return _empty_result("h1", "강남3구는 비강남3구보다 매매가가 높다")

    sales["is_gangnam"] = sales["gu"].isin(gangnam)

    group_a = sales[sales["is_gangnam"]]["price"]
    group_b = sales[~sales["is_gangnam"]]["price"]

    t_stat, p_value = stats.ttest_ind(group_a, group_b, equal_var=False)

    # 구별 평균가 차트 데이터
    avg_by_gu = sales.groupby("gu")["price"].mean().reset_index()
    avg_by_gu = avg_by_gu.sort_values("price", ascending=False).head(10)

    chart_data = []
    for _, row in avg_by_gu.iterrows():
        chart_data.append({
            "label": row["gu"],
            "groupA": round(row["price"]) if row["gu"] in gangnam else 0,
            "groupB": round(row["price"]) if row["gu"] not in gangnam else 0,
        })

    result = determine_result(p_value) if t_stat > 0 else "rejected"

    return {
        "id": "h1",
        "title": "강남3구는 비강남3구보다 매매가가 높다",
        "description": "강남구, 서초구, 송파구의 평균 매매가와 나머지 22개 구의 평균 매매가를 독립표본 t-검정으로 비교합니다.",
        "method": "independent t-test (Welch)",
        "result": result,
        "p_value": round(p_value, 6),
        "test_stat": round(t_stat, 4),
        "chart_data": chart_data,
        "details": {
            "n_gangnam": int(len(group_a)),
            "n_other": int(len(group_b)),
            "mean_gangnam": round(float(group_a.mean())),
            "mean_other": round(float(group_b.mean())),
            "significance_level": SIGNIFICANCE_LEVEL,
        },
    }


# ═══════════════════════════════════════════
# 가설 2: 대형 평수(84㎡ 초과)는 소형보다 가격 상승률이 높다
# ═══════════════════════════════════════════
def hypothesis_area_size(df: pd.DataFrame) -> dict:
    """ANOVA로 면적 구간별 평균가 차이를 검정."""
    sales = df[df["deal_type"] == "매매"].copy()
    if sales.empty:
        return _empty_result("h2", "면적이 넓을수록 단위면적당 가격이 높다")

    # 면적 구간 분류
    bins = [0, 60, 85, 135, float("inf")]
    labels = ["소형(~60㎡)", "중형(60~85㎡)", "대형(85~135㎡)", "초대형(135㎡~)"]
    sales["size_group"] = pd.cut(sales["area"], bins=bins, labels=labels, right=False)
    sales["price_per_area"] = sales["price"] / sales["area"]

    groups = [g["price_per_area"].dropna() for _, g in sales.groupby("size_group", observed=True)]
    groups = [g for g in groups if len(g) >= 2]

    if len(groups) < 2:
        return _empty_result("h2", "면적이 넓을수록 단위면적당 가격이 높다")

    f_stat, p_value = stats.f_oneway(*groups)

    chart_data = []
    for label in labels:
        subset = sales[sales["size_group"] == label]
        if not subset.empty:
            chart_data.append({
                "label": label,
                "groupA": round(float(subset["price_per_area"].mean()), 1),
                "groupB": int(len(subset)),
            })

    return {
        "id": "h2",
        "title": "면적이 넓을수록 단위면적당 가격이 높다",
        "description": "아파트 전용면적을 4개 구간(소형/중형/대형/초대형)으로 나누고, 단위면적당 매매가를 일원분산분석(ANOVA)으로 비교합니다.",
        "method": "one-way ANOVA",
        "result": determine_result(p_value),
        "p_value": round(p_value, 6),
        "test_stat": round(f_stat, 4),
        "chart_data": chart_data,
        "details": {
            "group_sizes": {label: int(len(sales[sales["size_group"] == label])) for label in labels},
            "significance_level": SIGNIFICANCE_LEVEL,
        },
    }


# ═══════════════════════════════════════════
# 가설 3: 전세가율이 높은 구는 매매가도 높다
# ═══════════════════════════════════════════
def hypothesis_jeonse_rate(df: pd.DataFrame) -> dict:
    """피어슨 상관분석으로 전세가율과 매매가의 상관관계를 검정."""
    gu_sales = df[df["deal_type"] == "매매"].groupby("gu")["price"].mean()
    gu_jeonse = df[df["deal_type"] == "전세"].groupby("gu")["price"].mean()

    combined = pd.DataFrame({"avg_sale": gu_sales, "avg_jeonse": gu_jeonse}).dropna()

    if len(combined) < 3:
        return _empty_result("h3", "전세가율이 높은 구는 매매가도 높다")

    combined["jeonse_rate"] = combined["avg_jeonse"] / combined["avg_sale"] * 100

    r, p_value = stats.pearsonr(combined["jeonse_rate"], combined["avg_sale"])

    chart_data = []
    for gu, row in combined.iterrows():
        chart_data.append({
            "label": gu,
            "groupA": round(row["jeonse_rate"], 1),
            "groupB": round(row["avg_sale"]),
        })

    return {
        "id": "h3",
        "title": "전세가율이 높은 구는 매매가도 높다",
        "description": "각 구의 전세가율(전세가/매매가 비율)과 평균 매매가 사이의 상관관계를 피어슨 상관분석으로 검정합니다.",
        "method": "Pearson correlation",
        "result": determine_result(p_value) if r > 0 else "rejected",
        "p_value": round(p_value, 6),
        "test_stat": round(r, 4),
        "chart_data": chart_data,
        "details": {
            "correlation_r": round(r, 4),
            "n_districts": len(combined),
            "significance_level": SIGNIFICANCE_LEVEL,
        },
    }


# ═══════════════════════════════════════════
# 가설 4: 신축(5년 이내)은 구축보다 비싸다
# ═══════════════════════════════════════════
def hypothesis_build_age(df: pd.DataFrame) -> dict:
    """독립표본 t-검정으로 신축 vs 구축 가격 비교."""
    sales = df[(df["deal_type"] == "매매") & df["build_year"].notna()].copy()
    if sales.empty:
        return _empty_result("h4", "신축 아파트(5년 이내)는 구축보다 비싸다")

    current_year = datetime.now().year
    sales["age"] = current_year - sales["build_year"]
    sales["price_per_area"] = sales["price"] / sales["area"]

    new = sales[sales["age"] <= 5]["price_per_area"].dropna()
    old = sales[sales["age"] > 20]["price_per_area"].dropna()

    if len(new) < 2 or len(old) < 2:
        return _empty_result("h4", "신축 아파트(5년 이내)는 구축보다 비싸다")

    t_stat, p_value = stats.ttest_ind(new, old, equal_var=False)

    # 연령대별 차트 데이터
    bins = [0, 5, 10, 20, 30, float("inf")]
    labels = ["~5년", "5~10년", "10~20년", "20~30년", "30년~"]
    sales["age_group"] = pd.cut(sales["age"], bins=bins, labels=labels, right=True)

    chart_data = []
    for label in labels:
        subset = sales[sales["age_group"] == label]
        if not subset.empty:
            chart_data.append({
                "label": label,
                "groupA": round(float(subset["price_per_area"].mean()), 1),
                "groupB": int(len(subset)),
            })

    result = determine_result(p_value) if t_stat > 0 else "rejected"

    return {
        "id": "h4",
        "title": "신축 아파트(5년 이내)는 구축보다 비싸다",
        "description": "준공 5년 이내 아파트와 20년 초과 아파트의 단위면적당 매매가를 독립표본 t-검정(Welch)으로 비교합니다.",
        "method": "independent t-test (Welch)",
        "result": result,
        "p_value": round(p_value, 6),
        "test_stat": round(t_stat, 4),
        "chart_data": chart_data,
        "details": {
            "n_new": int(len(new)),
            "n_old": int(len(old)),
            "mean_new": round(float(new.mean()), 1),
            "mean_old": round(float(old.mean()), 1),
            "significance_level": SIGNIFICANCE_LEVEL,
        },
    }


# ═══════════════════════════════════════════
# 가설 5: 고층일수록 가격이 높다
# ═══════════════════════════════════════════
def hypothesis_floor(df: pd.DataFrame) -> dict:
    """피어슨 상관분석으로 층수와 가격의 상관관계를 검정."""
    sales = df[(df["deal_type"] == "매매") & (df["floor"] > 0)].copy()
    if len(sales) < 10:
        return _empty_result("h5", "고층일수록 매매가가 높다")

    sales["price_per_area"] = sales["price"] / sales["area"]

    r, p_value = stats.pearsonr(sales["floor"], sales["price_per_area"])

    # 층 구간별 차트 데이터
    bins = [0, 5, 10, 15, 20, 25, float("inf")]
    labels = ["1~5층", "6~10층", "11~15층", "16~20층", "21~25층", "26층~"]
    sales["floor_group"] = pd.cut(sales["floor"], bins=bins, labels=labels, right=True)

    chart_data = []
    for label in labels:
        subset = sales[sales["floor_group"] == label]
        if not subset.empty:
            chart_data.append({
                "label": label,
                "groupA": round(float(subset["price_per_area"].mean()), 1),
                "groupB": int(len(subset)),
            })

    result = determine_result(p_value) if r > 0 else "rejected"

    return {
        "id": "h5",
        "title": "고층일수록 매매가가 높다",
        "description": "아파트 층수와 단위면적당 매매가 사이의 상관관계를 피어슨 상관분석으로 검정합니다.",
        "method": "Pearson correlation",
        "result": result,
        "p_value": round(p_value, 6),
        "test_stat": round(r, 4),
        "chart_data": chart_data,
        "details": {
            "correlation_r": round(r, 4),
            "n_samples": int(len(sales)),
            "significance_level": SIGNIFICANCE_LEVEL,
        },
    }


def _empty_result(id: str, title: str) -> dict:
    return {
        "id": id,
        "title": title,
        "description": "데이터가 부족하여 검정을 수행할 수 없습니다.",
        "method": "N/A",
        "result": "inconclusive",
        "p_value": 1.0,
        "test_stat": 0.0,
        "chart_data": [],
        "details": {"error": "insufficient data"},
    }


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
    if df.empty:
        print("거래 데이터가 없습니다. 가설 검정을 건너뜁니다.")
        return

    print(f"로드된 거래 데이터: {len(df)}건\n")

    results = [
        hypothesis_gangnam(df),
        hypothesis_area_size(df),
        hypothesis_jeonse_rate(df),
        hypothesis_build_age(df),
        hypothesis_floor(df),
    ]

    for r in results:
        symbol = "O" if r["result"] == "supported" else ("?" if r["result"] == "inconclusive" else "X")
        print(f"  [{symbol}] {r['title']} (p={r['p_value']:.4f})")

    print()
    save_results(results)


if __name__ == "__main__":
    main()
