"use client";

import { useState } from "react";
import { deleteReport } from "@/lib/reports";
import { timeAgo } from "@/lib/timeAgo";
import type { Report } from "@/types";

const CATEGORIES = [
  { value: "price", label: "가격 이상" },
  { value: "missing", label: "데이터 누락" },
  { value: "duplicate", label: "중복 데이터" },
  { value: "other", label: "기타" },
] as const;

interface ReportListProps {
  reports: Report[];
  onChanged: () => void;
}

export default function ReportList({ reports, onChanged }: ReportListProps) {
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [error, setError] = useState("");

  async function handleDelete() {
    if (!deleteTarget || deletePassword.length < 4) return;
    setError("");
    try {
      await deleteReport(deleteTarget, deletePassword);
      setDeleteTarget(null);
      setDeletePassword("");
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제 실패");
    }
  }

  if (reports.length === 0) return null;

  return (
    <ul className="mt-4 divide-y divide-zinc-100">
      {reports.map((r) => (
        <li key={r.id} className="py-3 first:pt-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs font-medium text-zinc-600">
                  {r.gu}
                </span>
                <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-500">
                  {CATEGORIES.find((c) => c.value === r.category)?.label ?? r.category}
                </span>
                <span className="text-xs text-zinc-400">
                  {r.nickname} &middot; {timeAgo(r.created_at)}
                </span>
                {r.status === "resolved" && (
                  <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-700">
                    해결됨
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-zinc-700">{r.content}</p>
            </div>
            <button
              onClick={() => {
                setDeleteTarget(r.id);
                setDeletePassword("");
                setError("");
              }}
              className="shrink-0 text-xs text-zinc-400 hover:text-red-500"
            >
              삭제
            </button>
          </div>

          {deleteTarget === r.id && (
            <div className="mt-2 flex items-center gap-2">
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="비밀번호"
                className="w-32 rounded border border-zinc-300 px-2 py-1 text-xs"
              />
              <button
                onClick={handleDelete}
                className="rounded bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600"
              >
                확인
              </button>
              <button
                onClick={() => setDeleteTarget(null)}
                className="text-xs text-zinc-400 hover:text-zinc-600"
              >
                취소
              </button>
              {error && deleteTarget === r.id && (
                <span className="text-xs text-red-500">{error}</span>
              )}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
