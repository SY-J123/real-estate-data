"""
국토부 실거래가 OpenAPI로 서울 아파트 매매/전세 데이터를 다시 수집해 CSV를 생성한다.

필수 환경변수:
  - DATA_GO_KR_SERVICE_KEY: 공공데이터포털 서비스키(URL decode 원본 권장)

선택 환경변수:
  - MOLIT_START_YM: 시작 계약년월 (YYYYMM, 기본값 202101)
  - MOLIT_END_YM: 종료 계약년월 (YYYYMM, 기본값 현재 월)

출력:
  - data/transactions.csv

주의:
  - API 응답 태그명이 한글/영문 혼재될 수 있어 둘 다 대응한다.
  - 전월세 API는 보증금/월세금 조합으로 "전세" / "월세"를 구분한다.
"""

from __future__ import annotations

import csv
import os
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Iterable
from xml.etree import ElementTree as ET

import requests

from config import (
    BASE_DIR, CSV_PATH, SEOUL_GU_CODES, CSV_COLUMNS,
    TRADE_URL, RENT_URL,
)

OUT_PATH = CSV_PATH
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


def month_range(start_ym: str, end_ym: str) -> list[str]:
    start = datetime.strptime(start_ym, "%Y%m")
    end = datetime.strptime(end_ym, "%Y%m")
    months: list[str] = []
    current = start
    while current <= end:
        months.append(current.strftime("%Y%m"))
        year = current.year + (current.month // 12)
        month = current.month % 12 + 1
        current = current.replace(year=year, month=month)
    return months


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
    if result_code and result_code not in ("00", "000"):
        raise RuntimeError(f"API 오류 {result_code}: {result_msg}")
    return root.findall(".//item")


def request_items(url: str, lawd_cd: str, deal_ymd: str) -> list[ET.Element]:
    page = 1
    items: list[ET.Element] = []
    while True:
        params = {
            "serviceKey": os.environ["DATA_GO_KR_SERVICE_KEY"],
            "LAWD_CD": lawd_cd,
            "DEAL_YMD": deal_ymd,
            "pageNo": str(page),
            "numOfRows": "1000",
        }
        for attempt in range(3):
            try:
                response = requests.get(url, params=params, timeout=30)
                response.raise_for_status()
                break
            except requests.exceptions.RequestException:
                if attempt == 2:
                    raise
                time.sleep(2 ** (attempt + 1))
        page_items = parse_xml_items(response.text)
        if not page_items:
            break
        items.extend(page_items)
        if len(page_items) < 1000:
            break
        page += 1
        time.sleep(0.1)
    return items


def normalize_trade_item(item: ET.Element, gu: str) -> dict[str, str] | None:
    raw_amount = pick(item, "거래금액", "dealAmount").replace(",", "").strip()
    if not raw_amount:
        return None

    deal_year = pick(item, "년", "dealYear", "계약년도", "contractYear")
    deal_month = pick(item, "월", "dealMonth", "계약월", "contractMonth")
    deal_day = pick(item, "일", "dealDay", "계약일", "contractDay")
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
    deal_year = pick(item, "년", "dealYear", "계약년도", "contractYear")
    deal_month = pick(item, "월", "dealMonth", "계약월", "contractMonth")
    deal_day = pick(item, "일", "dealDay", "계약일", "contractDay")
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


def collect_rows(months: Iterable[str]) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for ym in months:
        print(f"\n[{ym}] 수집 시작")
        for gu, code in SEOUL_GU_CODES.items():
            trade_items = request_items(TRADE_URL, code, ym)
            rent_items = request_items(RENT_URL, code, ym)

            trade_rows = [row for item in trade_items if (row := normalize_trade_item(item, gu))]
            rent_rows = [row for item in rent_items if (row := normalize_rent_item(item, gu))]
            rows.extend(trade_rows)
            rows.extend(rent_rows)

            print(
                f"  {gu}: 매매 {len(trade_rows):4d}건 / 전월세 {len(rent_rows):4d}건",
                flush=True,
            )
            time.sleep(0.05)
    return rows


def dedupe_rows(rows: list[dict[str, str]]) -> list[dict[str, str]]:
    seen: set[tuple[str, ...]] = set()
    deduped: list[dict[str, str]] = []
    for row in rows:
        key = tuple(row[col] for col in CSV_COLUMNS)
        if key in seen:
            continue
        seen.add(key)
        deduped.append(row)
    deduped.sort(key=lambda row: (row["deal_date"], row["gu"], row["dong"], row["apt_name"]), reverse=True)
    return deduped


def write_csv(rows: list[dict[str, str]]) -> None:
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUT_PATH.open("w", encoding="utf-8-sig", newline="") as fp:
        writer = csv.DictWriter(fp, fieldnames=CSV_COLUMNS)
        writer.writeheader()
        writer.writerows(rows)


def main() -> None:
    load_env_file()

    service_key = os.environ.get("DATA_GO_KR_SERVICE_KEY", "").strip()
    if not service_key:
        print("ERROR: DATA_GO_KR_SERVICE_KEY 환경변수가 필요합니다.")
        sys.exit(1)

    start_ym = os.environ.get("MOLIT_START_YM", "202101")
    end_ym = os.environ.get("MOLIT_END_YM", datetime.now().strftime("%Y%m"))
    months = month_range(start_ym, end_ym)

    print("=== 국토부 실거래가 재수집 ===")
    print(f"기간: {start_ym} ~ {end_ym} ({len(months)}개월)")
    print(f"대상 구: {len(SEOUL_GU_CODES)}개")

    rows = collect_rows(months)
    deduped = dedupe_rows(rows)
    write_csv(deduped)

    trade_count = sum(1 for row in deduped if row["deal_type"] == "매매")
    jeonse_count = sum(1 for row in deduped if row["deal_type"] == "전세")
    wolse_count = sum(1 for row in deduped if row["deal_type"] == "월세")

    print("\n=== 완료 ===")
    print(f"총 행 수: {len(deduped):,}")
    print(f"매매: {trade_count:,} / 전세: {jeonse_count:,} / 월세: {wolse_count:,}")
    print(f"저장: {OUT_PATH}")


if __name__ == "__main__":
    main()
