-- Supabase SQL Editor에서 실행할 것
-- reports / comments 테이블에 대한 rate limit (글로벌)

-- 1) reports: 전체 1분당 5건 제한 (DDoS 방어)
CREATE OR REPLACE FUNCTION check_report_rate_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (
    SELECT count(*) FROM reports
    WHERE created_at > now() - interval '1 minute'
  ) >= 5 THEN
    RAISE EXCEPTION '제보가 너무 많습니다. 잠시 후 다시 시도해주세요.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_report_rate_limit ON reports;
CREATE TRIGGER trg_report_rate_limit
  BEFORE INSERT ON reports
  FOR EACH ROW EXECUTE FUNCTION check_report_rate_limit();

-- 2) comments: 전체 1분당 10건 제한
CREATE OR REPLACE FUNCTION check_comment_rate_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (
    SELECT count(*) FROM comments
    WHERE created_at > now() - interval '1 minute'
  ) >= 10 THEN
    RAISE EXCEPTION '댓글이 너무 많습니다. 잠시 후 다시 시도해주세요.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_comment_rate_limit ON comments;
CREATE TRIGGER trg_comment_rate_limit
  BEFORE INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION check_comment_rate_limit();
