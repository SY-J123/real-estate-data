"use client";

import { useState } from "react";

interface CommentFormProps {
  onSubmit: (nickname: string, password: string, content: string) => Promise<void>;
}

export default function CommentForm({ onSubmit }: CommentFormProps) {
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim() || !password.trim() || !content.trim()) return;
    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(nickname.trim(), password, content.trim());
      setContent("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "댓글 작성에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="닉네임"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={20}
          className="w-32 rounded-md border border-border-default px-3 py-1.5 text-sm outline-none focus:border-border-focus"
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-32 rounded-md border border-border-default px-3 py-1.5 text-sm outline-none focus:border-border-focus"
        />
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="댓글을 입력하세요"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={500}
          className="flex-1 rounded-md border border-border-default px-3 py-1.5 text-sm outline-none focus:border-border-focus"
        />
        <button
          type="submit"
          disabled={isSubmitting || !nickname.trim() || !password.trim() || !content.trim()}
          className="rounded-md bg-btn-primary px-4 py-1.5 text-sm font-medium text-text-inverse transition-colors hover:bg-btn-primary-hover disabled:opacity-40"
        >
          등록
        </button>
      </div>
      {error && <p className="text-xs text-accent-red">{error}</p>}
    </form>
  );
}
