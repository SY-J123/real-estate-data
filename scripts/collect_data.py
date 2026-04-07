"""
국토교통부 공공데이터 API를 호출하여 서울시 아파트 실거래가/전세가 데이터를 수집하고
Supabase에 저장하는 스크립트.

GitHub Actions에서 주기적으로 실행됨.
"""

import os
import sys
import json
import time
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta

import requests
from supabase import create_client

# ── 환경변수 ──
API_KEY = os.environ.get("PUBLIC_DATA_API_KEY", "")
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")

# ── 서울시 구 코드 (법정동코드 앞 5자리) ──
DISTRICT_CODES = {
    "11680": "강남구", "11740": "강동구", "11305": "강북구", "11500": "강서구",
    "11620": "관악구", "11215": "광진구", "11530": "구로구", "11545": "금천구",
    "11350": "노원구", "11320": "도봉구", "11230": "동대문구", "11590": "동작구",
    "11440": "마포구", "11410": "서대문구", "11650": "서초구", "11200": "성동구",
    "11290": "성북구", "11710": "송파구", "11470": "양천구", "11560": "영등포구",
    "11170": "용산구", "11380": "은평구", "11110": "종로구", "11140": "중구",
    "11260": "중랑구",
}

# ── 국토교통부 API 엔드포인트 ──
API_URLS = {
    "매매": "http://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev",
    "전세": "http://apis.data.go.kr/1613000/RTMSDataSvcAptRent/getRTMSDataSvcAptRent",
}


def fetch_transactions(deal_type: str, district_code: str, deal_ym: str) -> list[dict]:
    """API에서 거래 데이터를 가져온다."""
    url = API_URLS[deal_type]
    params = {
        "serviceKey": API_KEY,
        "LAWD_CD": district_code,
        "DEAL_YMD": deal_ym,
        "pageNo": "1",
        "numOfRows": "9999",
        "type": "json",
    }

    try:
        resp = requests.get(url, params=params, timeout=30)
        resp.raise_for_status()
        text = resp.text.strip()

        # JSON 응답 시도
        if text.startswith("{"):
            data = json.loads(text)
            items = (
                data.get("response", {})
                .get("body", {})
                .get("items", {})
                .get("item", [])
            )
            if isinstance(items, dict):
                items = [items]
            return items

        # XML 응답 파싱
        if text.startswith("<?xml") or text.startswith("<"):
            return _parse_xml_response(text)

        print(f"  [WARN] 알 수 없는 응답 형식: {text[:200]}")
        return []

    except (requests.RequestException, json.JSONDecodeError) as e:
        print(f"  [ERROR] {deal_type} {district_code} {deal_ym}: {e}")
        return []


def _parse_xml_response(xml_text: str) -> list[dict]:
    """XML 응답을 파싱하여 dict 리스트로 반환한다."""
    try:
        root = ET.fromstring(xml_text)

        # 에러 응답 체크
        err_msg = root.findtext(".//errMsg") or root.findtext(".//returnAuthMsg")
        if err_msg and "SERVICE" in err_msg.upper():
            print(f"  [API ERROR] {err_msg}")
            return []

        items = root.findall(".//item")
        result = []
        for item in items:
            row = {}
            for child in item:
                row[child.tag] = child.text.strip() if child.text else ""
            result.append(row)
        return result
    except ET.ParseError as e:
        print(f"  [XML ERROR] {e}")
        return []


def parse_trade_item(item: dict, district_code: str) -> dict | None:
    """매매 거래 데이터를 파싱한다."""
    try:
        year = int(item.get("dealYear", 0) or item.get("년", 0))
        month = int(item.get("dealMonth", 0) or item.get("월", 0))
        day = int(item.get("dealDay", 0) or item.get("일", 0))

        price_str = str(item.get("dealAmount", "") or item.get("거래금액", ""))
        price = int(price_str.replace(",", "").strip())

        return {
            "gu": DISTRICT_CODES[district_code],
            "dong": str(item.get("umdNm", "") or item.get("법정동", "")).strip(),
            "apt_name": str(item.get("aptNm", "") or item.get("아파트", "")).strip(),
            "area": float(item.get("excluUseAr", 0) or item.get("전용면적", 0)),
            "floor": int(item.get("floor", 0) or item.get("층", 0)),
            "price": price,
            "deal_date": f"{year:04d}-{month:02d}-{day:02d}",
            "build_year": int(item.get("buildYear", 0) or item.get("건축년도", 0)) or None,
            "deal_type": "매매",
        }
    except (ValueError, KeyError) as e:
        print(f"  [WARN] 매매 파싱 실패: {e}")
        return None


def parse_rent_item(item: dict, district_code: str) -> dict | None:
    """전세 거래 데이터를 파싱한다."""
    try:
        year = int(item.get("dealYear", 0) or item.get("년", 0))
        month = int(item.get("dealMonth", 0) or item.get("월", 0))
        day = int(item.get("dealDay", 0) or item.get("일", 0))

        deposit_str = str(item.get("deposit", "") or item.get("보증금액", ""))
        deposit = int(deposit_str.replace(",", "").strip())

        monthly = str(item.get("monthlyRent", "") or item.get("월세금액", ""))
        monthly_rent = int(monthly.replace(",", "").strip()) if monthly.strip() else 0

        deal_type = "월세" if monthly_rent > 0 else "전세"

        return {
            "gu": DISTRICT_CODES[district_code],
            "dong": str(item.get("umdNm", "") or item.get("법정동", "")).strip(),
            "apt_name": str(item.get("aptNm", "") or item.get("아파트", "")).strip(),
            "area": float(item.get("excluUseAr", 0) or item.get("전용면적", 0)),
            "floor": int(item.get("floor", 0) or item.get("층", 0)),
            "price": deposit,
            "deal_date": f"{year:04d}-{month:02d}-{day:02d}",
            "build_year": int(item.get("buildYear", 0) or item.get("건축년도", 0)) or None,
            "deal_type": deal_type,
        }
    except (ValueError, KeyError) as e:
        print(f"  [WARN] 전세 파싱 실패: {e}")
        return None


def collect_all(months_back: int = 12) -> list[dict]:
    """최근 N개월 데이터를 전체 수집한다."""
    all_rows = []
    now = datetime.now()

    # 수집할 연월 목록
    deal_yms = []
    for i in range(months_back):
        dt = now - timedelta(days=30 * i)
        deal_yms.append(dt.strftime("%Y%m"))
    deal_yms = list(set(deal_yms))  # 중복 제거
    deal_yms.sort()

    total = len(DISTRICT_CODES) * len(deal_yms) * 2
    count = 0
    debug_logged = False

    for deal_ym in deal_yms:
        for code, gu in DISTRICT_CODES.items():
            # 매매
            count += 1
            print(f"[{count}/{total}] 매매 {gu} {deal_ym}")

            # 첫 번째 요청의 raw 응답 출력 (디버깅)
            if not debug_logged:
                try:
                    debug_resp = requests.get(API_URLS["매매"], params={
                        "serviceKey": API_KEY,
                        "LAWD_CD": code,
                        "DEAL_YMD": deal_ym,
                        "pageNo": "1",
                        "numOfRows": "3",
                        "type": "json",
                    }, timeout=30)
                    print(f"  [DEBUG] Status: {debug_resp.status_code}")
                    print(f"  [DEBUG] Response (first 500 chars): {debug_resp.text[:500]}")
                    debug_logged = True
                except Exception as e:
                    print(f"  [DEBUG ERROR] {e}")
            items = fetch_transactions("매매", code, deal_ym)
            for item in items:
                row = parse_trade_item(item, code)
                if row:
                    all_rows.append(row)

            # 전세/월세
            count += 1
            print(f"[{count}/{total}] 전세 {gu} {deal_ym}")
            items = fetch_transactions("전세", code, deal_ym)
            for item in items:
                row = parse_rent_item(item, code)
                if row:
                    all_rows.append(row)

            time.sleep(0.3)  # API 호출 간격

    print(f"\n수집 완료: {len(all_rows)}건")
    return all_rows


def upsert_to_supabase(rows: list[dict]) -> None:
    """Supabase에 데이터를 누적 저장한다 (중복 무시)."""
    sb = create_client(SUPABASE_URL, SUPABASE_KEY)

    # 배치 단위로 upsert (500건씩, 중복은 무시)
    batch_size = 500
    saved = 0
    for i in range(0, len(rows), batch_size):
        batch = rows[i : i + batch_size]
        try:
            sb.table("transactions").upsert(
                batch,
                on_conflict="gu,dong,apt_name,area,floor,deal_date,deal_type,price",
                ignore_duplicates=True,
            ).execute()
            saved += len(batch)
        except Exception as e:
            print(f"  [WARN] 배치 저장 실패 ({i}~{i+len(batch)}): {e}")
        print(f"  저장: {saved}/{len(rows)}")

    # 메타데이터 업데이트
    sb.table("metadata").upsert({
        "key": "last_updated",
        "value": datetime.now().isoformat(),
    }, on_conflict="key").execute()

    # DB 용량 모니터링
    try:
        result = sb.rpc("get_db_size").execute()
        if result.data:
            print(f"\n[DB 용량] {result.data}")
    except Exception:
        pass

    # 총 row 수 확인
    try:
        result = sb.table("transactions").select("id", count="exact", head=True).execute()
        print(f"[DB 총 거래건수] {result.count}건")
    except Exception:
        pass

    print("DB 저장 완료")


def main():
    if not API_KEY:
        print("ERROR: PUBLIC_DATA_API_KEY 환경변수가 설정되지 않았습니다.")
        sys.exit(1)
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("ERROR: SUPABASE_URL / SUPABASE_SERVICE_KEY 환경변수가 설정되지 않았습니다.")
        sys.exit(1)

    months = int(os.environ.get("COLLECT_MONTHS", "12"))
    print(f"=== 데이터 수집 시작 (최근 {months}개월) ===\n")

    rows = collect_all(months)
    if rows:
        upsert_to_supabase(rows)
    else:
        print("수집된 데이터가 없습니다.")


if __name__ == "__main__":
    main()
