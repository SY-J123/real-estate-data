-- =============================================
-- 서울 부동산 대시보드 DB 스키마
-- =============================================

-- 1. 개별 거래 데이터
CREATE TABLE IF NOT EXISTS transactions (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  gu            TEXT NOT NULL,          -- 구
  dong          TEXT NOT NULL,          -- 동
  apt_name      TEXT NOT NULL,          -- 아파트명
  area          NUMERIC(8,2) NOT NULL,  -- 전용면적 (㎡)
  floor         INTEGER NOT NULL,       -- 층
  price         INTEGER NOT NULL,       -- 거래금액 (만원)
  deal_date     DATE NOT NULL,          -- 거래일
  build_year    INTEGER,                -- 건축년도
  deal_type     TEXT NOT NULL CHECK (deal_type IN ('매매', '전세', '월세')),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 중복 방지용 unique 제약
ALTER TABLE transactions
  ADD CONSTRAINT uq_transaction
  UNIQUE (gu, dong, apt_name, area, floor, deal_date, deal_type, price);

-- 인덱스
CREATE INDEX idx_transactions_gu ON transactions (gu);
CREATE INDEX idx_transactions_dong ON transactions (gu, dong);
CREATE INDEX idx_transactions_deal_date ON transactions (deal_date);
CREATE INDEX idx_transactions_deal_type ON transactions (deal_type);

-- 2. 가설 검정 결과
CREATE TABLE IF NOT EXISTS hypotheses (
  id            TEXT PRIMARY KEY,
  title         TEXT NOT NULL,
  description   TEXT NOT NULL,
  method        TEXT NOT NULL,           -- 검정 방법 (t-test, anova, correlation 등)
  result        TEXT NOT NULL CHECK (result IN ('supported', 'rejected', 'inconclusive')),
  p_value       NUMERIC(10,6) NOT NULL,
  test_stat     NUMERIC(12,4),           -- 검정통계량
  chart_data    JSONB NOT NULL,          -- 시각화용 데이터
  details       JSONB,                   -- 추가 상세 (표본크기, 효과크기 등)
  analyzed_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 메타데이터 (최종 업데이트 시각 등)
CREATE TABLE IF NOT EXISTS metadata (
  key           TEXT PRIMARY KEY,
  value         TEXT NOT NULL,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- RPC 함수: 구별 집계
-- =============================================
CREATE OR REPLACE FUNCTION get_district_summary(
  from_date DATE,
  prev_from_date DATE
)
RETURNS TABLE (
  gu              TEXT,
  avg_price       NUMERIC,
  prev_avg_price  NUMERIC,
  change_rate     NUMERIC,
  transaction_count BIGINT,
  jeonse_rate     NUMERIC,
  avg_jeonse_price NUMERIC
)
LANGUAGE SQL STABLE
AS $$
  WITH current_period AS (
    SELECT
      gu,
      AVG(price) FILTER (WHERE deal_type = '매매') AS avg_price,
      AVG(price) FILTER (WHERE deal_type = '전세') AS avg_jeonse_price,
      COUNT(*) FILTER (WHERE deal_type = '매매') AS transaction_count
    FROM transactions
    WHERE deal_date >= from_date
    GROUP BY gu
  ),
  prev_period AS (
    SELECT
      gu,
      AVG(price) FILTER (WHERE deal_type = '매매') AS prev_avg_price
    FROM transactions
    WHERE deal_date >= prev_from_date AND deal_date < from_date
    GROUP BY gu
  )
  SELECT
    c.gu,
    ROUND(c.avg_price) AS avg_price,
    ROUND(COALESCE(p.prev_avg_price, c.avg_price)) AS prev_avg_price,
    ROUND(
      CASE
        WHEN COALESCE(p.prev_avg_price, 0) = 0 THEN 0
        ELSE ((c.avg_price - p.prev_avg_price) / p.prev_avg_price * 100)
      END,
      1
    ) AS change_rate,
    c.transaction_count,
    ROUND(
      CASE
        WHEN COALESCE(c.avg_price, 0) = 0 THEN 0
        ELSE (COALESCE(c.avg_jeonse_price, 0) / c.avg_price * 100)
      END,
      1
    ) AS jeonse_rate,
    ROUND(COALESCE(c.avg_jeonse_price, 0)) AS avg_jeonse_price
  FROM current_period c
  LEFT JOIN prev_period p ON c.gu = p.gu
  ORDER BY c.gu;
$$;

-- =============================================
-- RPC 함수: 동별 집계
-- =============================================
CREATE OR REPLACE FUNCTION get_dong_summary(
  from_date DATE,
  prev_from_date DATE
)
RETURNS TABLE (
  gu              TEXT,
  dong            TEXT,
  avg_price       NUMERIC,
  prev_avg_price  NUMERIC,
  change_rate     NUMERIC,
  transaction_count BIGINT,
  jeonse_rate     NUMERIC,
  avg_jeonse_price NUMERIC
)
LANGUAGE SQL STABLE
AS $$
  WITH current_period AS (
    SELECT
      gu, dong,
      AVG(price) FILTER (WHERE deal_type = '매매') AS avg_price,
      AVG(price) FILTER (WHERE deal_type = '전세') AS avg_jeonse_price,
      COUNT(*) FILTER (WHERE deal_type = '매매') AS transaction_count
    FROM transactions
    WHERE deal_date >= from_date
    GROUP BY gu, dong
  ),
  prev_period AS (
    SELECT
      gu, dong,
      AVG(price) FILTER (WHERE deal_type = '매매') AS prev_avg_price
    FROM transactions
    WHERE deal_date >= prev_from_date AND deal_date < from_date
    GROUP BY gu, dong
  )
  SELECT
    c.gu,
    c.dong,
    ROUND(c.avg_price) AS avg_price,
    ROUND(COALESCE(p.prev_avg_price, c.avg_price)) AS prev_avg_price,
    ROUND(
      CASE
        WHEN COALESCE(p.prev_avg_price, 0) = 0 THEN 0
        ELSE ((c.avg_price - p.prev_avg_price) / p.prev_avg_price * 100)
      END,
      1
    ) AS change_rate,
    c.transaction_count,
    ROUND(
      CASE
        WHEN COALESCE(c.avg_price, 0) = 0 THEN 0
        ELSE (COALESCE(c.avg_jeonse_price, 0) / c.avg_price * 100)
      END,
      1
    ) AS jeonse_rate,
    ROUND(COALESCE(c.avg_jeonse_price, 0)) AS avg_jeonse_price
  FROM current_period c
  LEFT JOIN prev_period p ON c.gu = p.gu AND c.dong = p.dong
  ORDER BY c.gu, c.dong;
$$;
