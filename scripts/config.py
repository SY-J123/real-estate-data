"""
스크립트 공용 설정 모듈.
여러 스크립트에서 반복되는 상수·경로를 한곳에서 관리한다.
"""

import os
from pathlib import Path

# ── 경로 ──
BASE_DIR = Path(__file__).resolve().parent.parent
CSV_PATH = BASE_DIR / "data" / "transactions.csv"
OUTPUT_DIR = BASE_DIR / "public" / "data"

# ── 서울 25개 구 법정동 코드 ──
SEOUL_GU_CODES = {
    "종로구": "11110", "중구": "11140", "용산구": "11170", "성동구": "11200",
    "광진구": "11215", "동대문구": "11230", "중랑구": "11260", "성북구": "11290",
    "강북구": "11305", "도봉구": "11320", "노원구": "11350", "은평구": "11380",
    "서대문구": "11410", "마포구": "11440", "양천구": "11470", "강서구": "11500",
    "구로구": "11530", "금천구": "11545", "영등포구": "11560", "동작구": "11590",
    "관악구": "11620", "서초구": "11650", "강남구": "11680", "송파구": "11710",
    "강동구": "11740",
}

# ── CSV 컬럼 정의 ──
CSV_COLUMNS = [
    "gu", "dong", "apt_name", "area", "floor",
    "price", "deal_date", "build_year", "deal_type",
]

# ── 대시보드 집계 옵션 ──
MONTHS_OPTIONS = [1, 3, 6, 12, 36, 60]
AREA_RANGES = {
    "all": (0, 9999),
    "small": (0, 60),
    "medium": (60, 85),
    "large": (85, 9999),
}

# ── 데이터 품질 기준 ──
MIN_TRADE_COUNT = 50   # 구-월 최소 매매 건수 (미만이면 누락 판정)
MIN_RENT_COUNT = 30    # 구-월 최소 전월세 건수

# ── 이상치 제거 임계값 (만원/평) ──
PRICE_THRESHOLDS = {
    "매매": (1000, 15000),
    "전세": (500, 10000),
}

# ── 공공데이터 API URL ──
TRADE_URL = "https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev"
RENT_URL = "https://apis.data.go.kr/1613000/RTMSDataSvcAptRent/getRTMSDataSvcAptRent"
