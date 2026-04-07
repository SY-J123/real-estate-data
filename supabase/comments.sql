-- Supabase SQL Editor에서 실행할 것

CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hypothesis_id TEXT NOT NULL,
  nickname TEXT NOT NULL CHECK (char_length(nickname) >= 1 AND char_length(nickname) <= 20),
  password TEXT NOT NULL CHECK (char_length(password) >= 4),
  content TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 500),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- RLS 활성화
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 누구나 읽기 가능
CREATE POLICY "comments_select" ON comments FOR SELECT USING (true);

-- 누구나 삽입 가능
CREATE POLICY "comments_insert" ON comments FOR INSERT WITH CHECK (true);

-- 누구나 수정/삭제 요청 가능 (비밀번호 검증은 앱 레벨)
CREATE POLICY "comments_update" ON comments FOR UPDATE USING (true);
CREATE POLICY "comments_delete" ON comments FOR DELETE USING (true);

-- 인덱스
CREATE INDEX idx_comments_hypothesis ON comments (hypothesis_id, created_at DESC);
