"use client";

import { useState } from "react";
import { SEOUL_DISTRICTS } from "@/constants";
import { createReport } from "@/lib/reports";

const CATEGORIES = [
  { value: "price", label: "가격 이상" },
  { value: "missing", label: "데이터 누락" },
  { value: "duplicate", label: "중복 데이터" },
  { value: "other", label: "기타" },
] as const;

interface ReportFormProps {
  onCreated: () => void;
  onCancel: () => void;
}

export default function ReportForm({ onCreated, onCancel }: ReportFormProps) {
  const [gu, setGu] = useState("");
  const [category, setCategory] = useState("price");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!gu || !content.trim() || !nickname.trim() || password.length < 4) return;

    setIsLoading(true);
    setError("");
    try {
      await createReport(gu, category, nickname.trim(), password, content.trim());
      setContent("");
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "제보 실패");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs text-text-muted">구</label>
          <select
            value={gu}
            onChange={(e) => setGu(e.target.value)}
            className="w-full rounded border border-border-input px-2.5 py-1.5 text-sm"
            required
          >
            <option value="">선택</option>
            {SEOUL_DISTRICTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-text-muted">유형</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded border border-border-input px-2.5 py-1.5 text-sm"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs text-text-muted">닉네임</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={20}
            placeholder="닉네임"
            className="w-full rounded border border-border-input px-2.5 py-1.5 text-sm"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-text-muted">비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={4}
            placeholder="4자 이상"
            className="w-full rounded border border-border-input px-2.5 py-1.5 text-sm"
            required
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs text-text-muted">내용</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="예: 강남구 2026-02 매매 평당가가 실제보다 낮게 표시됩니다"
          className="w-full resize-none rounded border border-border-input px-2.5 py-1.5 text-sm"
          required
        />
        <p className="mt-0.5 text-right text-xs text-text-faint">{content.length}/500</p>
      </div>
      {error && <p className="text-xs text-accent-red">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 rounded-md bg-btn-primary py-2 text-sm font-medium text-text-inverse hover:bg-btn-primary-hover disabled:opacity-50"
        >
          {isLoading ? "전송 중..." : "제보 등록"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-4 py-2 text-sm text-text-muted hover:bg-bg-muted"
        >
          취소
        </button>
      </div>
    </form>
  );
}
