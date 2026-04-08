"""
transactions.csv에서 누락된 구-월 조합만 골라서 재수집 후 기존 데이터에 병합한다.

사용법:
  python scripts/patch_missing_transactions.py
"""

from __future__ import annotations

import csv
import os
import sys
import time
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from xml.etree import ElementTree as ET

import requests

from config import (
    BASE_DIR, CSV_PATH, SEOUL_GU_CODES, CSV_COLUMNS,
    TRADE_URL, RENT_URL, MIN_TRADE_COUNT, MIN_RENT_COUNT,
)

ENV_PATH = BASE_DIR / ".env.local"


def load_env_file() -> None:
    if not ENV_PATH.exists():
        return
    for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip())


def pick(item: ET.Element, *keys: str) -> str:
    for key in keys:
        child = item.find(key)
        if child is not None and child.text is not None:
            return child.text.strip()
    return ""


def parse_xml_items(text: str) -> list[ET.Element]:
    root = ET.fromstring(text)
    result_code = root.findtext(".//resultCode", default="").strip()
    result_msg = root.findtext(".//resultMsg", default="").strip()
    if result_code and result_code != "00":
        raise RuntimeError(f"API 오류 {result_code}: {result_msg}")
    return root.findall(".//item")


def request_items(url: str, lawd_cd: str, deal_ymd: str) -> list[ET.Element]:
    page = 1
    items: list[ET.Element] = []
    retries = 3
    while True:
        params = {
            "serviceKey": os.environ["DATA_GO_KR_SERVICE_KEY"],
            "LAWD_CD": lawd_cd,
            "DEAL_YMD": deal_ymd,
            "pageNo": str(page),
            "numOfRows": "1000",
        }
        for attempt in range(retries):
            try:
                response = requests.get(url, params=params, timeout=60)
                response.raise_for_status()
                page_items = parse_xml_items(response.text)
                break
            except Exception as e:
                if attempt < retries - 1:
                    print(f"    재시도 {attempt+1}/{retries}: {e}")
                    time.sleep(2 * (attempt + 1))
                else:
                    print(f"    실패: {e}")
                    return items
        else:
            break

        if not page_items:
            break
        items.extend(page_items)
        if len(page_items) < 1000:
            break
        page += 1
        time.sleep(0.2)
    return items


def normalize_trade_item(item: ET.Element, gu: str) -> dict[str, str] | None:
    raw_amount = pick(item, "거래금액", "dealAmount").replace(",", "").strip()
    if not raw_amount:
        return None
    deal_year = pick(item, "년", "dealYear", "계약년도")
    deal_month = pick(item, "월", "dealMonth", "계약월")
    deal_day = pick(item, "일", "dealDay", "계약일")
    if not (deal_year and deal_month and deal_day):
        return None
    return {
        "gu": gu,
        "dong": pick(item, "법정동", "umdNm"),
        "apt_name": pick(item, "아파트", "aptNm"),
        "area": pick(item, "전용면적", "excluUseAr"),
        "floor": pick(item, "층", "floor"),
        "price": raw_amount,
        "deal_date": f"{deal_year}-{deal_month.zfill(2)}-{deal_day.zfill(2)}",
        "build_year": pick(item, "건축년도", "buildYear"),
        "deal_type": "매매",
    }


def normalize_rent_item(item: ET.Element, gu: str) -> dict[str, str] | None:
    deposit = pick(item, "보증금액", "deposit").replace(",", "").strip()
    monthly_rent = pick(item, "월세금액", "monthlyRent").replace(",", "").strip()
    deal_year = pick(item, "년", "dealYear", "계약년도")
    deal_month = pick(item, "월", "dealMonth", "계약월")
    deal_day = pick(item, "일", "dealDay", "계약일")
    if not (deposit and deal_year and deal_month and deal_day):
        return None
    try:
        monthly_value = int(monthly_rent or "0")
    except ValueError:
        monthly_value = 0
    deal_type = "전세" if monthly_value == 0 else "월세"
    return {
        "gu": gu,
        "dong": pick(item, "법정동", "umdNm"),
        "apt_name": pick(item, "아파트", "aptNm"),
        "area": pick(item, "전용면적", "excluUseAr"),
        "floor": pick(item, "층", "floor"),
        "price": deposit,
        "deal_date": f"{deal_year}-{deal_month.zfill(2)}-{deal_day.zfill(2)}",
        "build_year": pick(item, "건축년도", "buildYear"),
        "deal_type": deal_type,
    }


def find_gaps(csv_path: Path, start_ym: str, end_ym: str) -> list[tuple[str, str]]:
    """CSV를 읽어 구-월 조합 중 매매 건수가 MIN 미만인 곳을 찾는다."""
    counts: dict[tuple[str, str], dict[str, int]] = defaultdict(lambda: {"매매": 0, "전세": 0, "월세": 0})

    with csv_path.open(encoding="utf-8-sig") as fp:
        reader = csv.DictReader(fp)
        for row in reader:
            date = row.get("deal_date", "")
            month = date[:7].replace("-", "")  # YYYY-MM -> YYYYMM
            if not month or month < start_ym or month > end_ym:
                continue
            gu = row.get("gu", "")
            deal_type = row.get("deal_type", "").strip()
            if gu and deal_type in counts[(gu, month)]:
                counts[(gu, month)][deal_type] += 1

    # 모든 구-월 조합 검사
    gaps = []
    start = datetime.strptime(start_ym, "%Y%m")
    end = datetime.strptime(end_ym, "%Y%m")
    current = start
    months = []
    while current <= end:
        months.append(current.strftime("%Y%m"))
        year = current.year + (current.month // 12)
        month = current.month % 12 + 1
        current = current.replace(year=year, month=month)

    for ym in months:
        for gu in SEOUL_GU_CODES:
            c = counts.get((gu, ym), {"매매": 0})
            if c["매매"] < MIN_TRADE_COUNT:
                gaps.append((gu, ym))

    return gaps


def read_existing(csv_path: Path) -> list[dict[str, str]]:
    rows = []
    with csv_path.open(encoding="utf-8-sig") as fp:
        reader = csv.DictReader(fp)
        for row in reader:
            rows.append({col: row[col] for col in CSV_COLUMNS})
    return rows


def remove_gap_rows(rows: list[dict[str, str]], gaps: list[tuple[str, str]]) -> list[dict[str, str]]:
    """재수집 대상 구-월의 기존 데이터를 제거한다."""
    gap_set = set(gaps)
    result = []
    for row in rows:
        date = row.get("deal_date", "")
        ym = date[:7].replace("-", "")
        gu = row.get("gu", "")
        if (gu, ym) in gap_set:
            continue
        result.append(row)
    return result


def dedupe_and_sort(rows: list[dict[str, str]]) -> list[dict[str, str]]:
    seen: set[tuple[str, ...]] = set()
    deduped: list[dict[str, str]] = []
    for row in rows:
        key = tuple(row[col] for col in CSV_COLUMNS)
        if key in seen:
            continue
        seen.add(key)
        deduped.append(row)
    deduped.sort(key=lambda r: (r["deal_date"], r["gu"], r["dong"], r["apt_name"]), reverse=True)
    return deduped


def write_csv(rows: list[dict[str, str]]) -> None:
    CSV_PATH.parent.mkdir(parents=True, exist_ok=True)
    with CSV_PATH.open("w", encoding="utf-8-sig", newline="") as fp:
        writer = csv.DictWriter(fp, fieldnames=CSV_COLUMNS)
        writer.writeheader()
        writer.writerows(rows)


def main() -> None:
    load_env_file()

    service_key = os.environ.get("DATA_GO_KR_SERVICE_KEY", "").strip()
    if not service_key:
        print("ERROR: DATA_GO_KR_SERVICE_KEY 환경변수가 필요합니다.")
        sys.exit(1)

    # 2021-01 ~ 현재 전체 기간에서 누락 구간 탐색
    start_ym = "202101"
    end_ym = datetime.now().strftime("%Y%m")

    print("=== 누락 구간 탐색 중... ===")
    gaps = find_gaps(CSV_PATH, start_ym, end_ym)

    if not gaps:
        print("누락 구간이 없습니다!")
        return

    gap_months = sorted(set(ym for _, ym in gaps))
    print(f"누락 구간: {len(gaps)}개 (구-월 조합)")
    print(f"해당 월: {', '.join(gap_months)}")
    for gu, ym in sorted(gaps):
        print(f"  {gu} {ym[:4]}-{ym[4:]}")

    # 기존 데이터에서 재수집 대상 제거
    print("\n=== 기존 데이터 로드 ===")
    existing = read_existing(CSV_PATH)
    print(f"기존 행 수: {len(existing):,}")
    cleaned = remove_gap_rows(existing, gaps)
    print(f"재수집 대상 제거 후: {len(cleaned):,}")

    # 누락 구간 재수집
    print("\n=== 재수집 시작 ===")
    new_rows: list[dict[str, str]] = []
    total = len(gaps)
    for i, (gu, ym) in enumerate(sorted(gaps), 1):
        code = SEOUL_GU_CODES[gu]
        print(f"[{i}/{total}] {gu} {ym[:4]}-{ym[4:]}...", end=" ", flush=True)

        trade_items = request_items(TRADE_URL, code, ym)
        rent_items = request_items(RENT_URL, code, ym)

        trade_rows = [r for item in trade_items if (r := normalize_trade_item(item, gu))]
        rent_rows = [r for item in rent_items if (r := normalize_rent_item(item, gu))]
        new_rows.extend(trade_rows)
        new_rows.extend(rent_rows)

        print(f"매매 {len(trade_rows)}건 / 전월세 {len(rent_rows)}건")
        time.sleep(0.3)

    # 병합
    print("\n=== 병합 및 저장 ===")
    merged = cleaned + new_rows
    final = dedupe_and_sort(merged)
    write_csv(final)

    trade_count = sum(1 for r in final if r["deal_type"] == "매매")
    jeonse_count = sum(1 for r in final if r["deal_type"] == "전세")
    wolse_count = sum(1 for r in final if r["deal_type"] == "월세")

    print(f"최종 행 수: {len(final):,} (이전: {len(existing):,}, 차이: {len(final)-len(existing):+,})")
    print(f"매매: {trade_count:,} / 전세: {jeonse_count:,} / 월세: {wolse_count:,}")
    print(f"저장: {CSV_PATH}")


if __name__ == "__main__":
    main()
