-- Supabase SQL Editor에서 실행할 것

CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gu TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('price', 'missing', 'duplicate', 'other')),
  nickname TEXT NOT NULL CHECK (char_length(nickname) >= 1 AND char_length(nickname) <= 20),
  password TEXT NOT NULL CHECK (char_length(password) >= 4),
  content TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 500),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- RLS 활성화
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- 누구나 읽기/삽입 가능
CREATE POLICY "reports_select" ON reports FOR SELECT USING (true);
CREATE POLICY "reports_insert" ON reports FOR INSERT WITH CHECK (true);

-- 삭제는 비밀번호 검증 후 앱 레벨에서 처리
CREATE POLICY "reports_delete" ON reports FOR DELETE USING (true);

-- 인덱스
CREATE INDEX idx_reports_status ON reports (status, created_at DESC);
CREATE INDEX idx_reports_gu ON reports (gu, created_at DESC);
