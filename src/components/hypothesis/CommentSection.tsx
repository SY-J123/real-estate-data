"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchComments, createComment, updateComment, deleteComment } from "@/lib/comments";
import type { Comment } from "@/types";

interface CommentSectionProps {
  hypothesisId: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "방금 전";
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}일 전`;
  return new Date(dateStr).toLocaleDateString("ko-KR");
}

export default function CommentSection({ hypothesisId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 작성 폼
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 수정/삭제 모달
  const [actionTarget, setActionTarget] = useState<{ id: string; action: "edit" | "delete" } | null>(null);
  const [actionPassword, setActionPassword] = useState("");
  const [editContent, setEditContent] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const loadComments = useCallback(async () => {
    try {
      const data = await fetchComments(hypothesisId);
      setComments(data);
    } catch {
      // 테이블이 아직 없을 수 있음
    } finally {
      setIsLoading(false);
    }
  }, [hypothesisId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim() || !password.trim() || !content.trim()) return;
    setIsSubmitting(true);
    setError(null);

    try {
      await createComment(hypothesisId, nickname.trim(), password, content.trim());
      setContent("");
      await loadComments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "댓글 작성에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAction = async () => {
    if (!actionTarget || !actionPassword.trim()) return;
    setActionError(null);

    try {
      if (actionTarget.action === "delete") {
        await deleteComment(actionTarget.id, actionPassword);
      } else {
        if (!editContent.trim()) return;
        await updateComment(actionTarget.id, actionPassword, editContent.trim());
      }
      setActionTarget(null);
      setActionPassword("");
      setEditContent("");
      await loadComments();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "작업에 실패했습니다.");
    }
  };

  const openEdit = (comment: Comment) => {
    setActionTarget({ id: comment.id, action: "edit" });
    setEditContent(comment.content);
    setActionPassword("");
    setActionError(null);
  };

  const openDelete = (comment: Comment) => {
    setActionTarget({ id: comment.id, action: "delete" });
    setActionPassword("");
    setActionError(null);
  };

  return (
    <div className="mt-6 rounded-lg border border-zinc-200 bg-white p-6">
      <h3 className="text-sm font-semibold text-zinc-700">
        댓글 {!isLoading && <span className="font-normal text-zinc-400">{comments.length}</span>}
      </h3>

      {/* 작성 폼 */}
      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="닉네임"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={20}
            className="w-32 rounded-md border border-zinc-200 px-3 py-1.5 text-sm outline-none focus:border-zinc-400"
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-32 rounded-md border border-zinc-200 px-3 py-1.5 text-sm outline-none focus:border-zinc-400"
          />
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="댓글을 입력하세요"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={500}
            className="flex-1 rounded-md border border-zinc-200 px-3 py-1.5 text-sm outline-none focus:border-zinc-400"
          />
          <button
            type="submit"
            disabled={isSubmitting || !nickname.trim() || !password.trim() || !content.trim()}
            className="rounded-md bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-40"
          >
            등록
          </button>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </form>

      {/* 댓글 목록 */}
      <div className="mt-5 space-y-3">
        {isLoading ? (
          <p className="text-xs text-zinc-400">로딩 중...</p>
        ) : comments.length === 0 ? (
          <p className="text-xs text-zinc-400">아직 댓글이 없습니다.</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="border-b border-zinc-100 pb-3 last:border-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-800">{c.nickname}</span>
                  <span className="text-xs text-zinc-400">{timeAgo(c.created_at)}</span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(c)}
                    className="text-xs text-zinc-400 hover:text-zinc-600"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => openDelete(c)}
                    className="text-xs text-zinc-400 hover:text-red-500"
                  >
                    삭제
                  </button>
                </div>
              </div>
              <p className="mt-1 text-sm text-zinc-600">{c.content}</p>
            </div>
          ))
        )}
      </div>

      {/* 수정/삭제 모달 */}
      {actionTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
            <h4 className="text-sm font-semibold text-zinc-800">
              {actionTarget.action === "edit" ? "댓글 수정" : "댓글 삭제"}
            </h4>
            <p className="mt-1 text-xs text-zinc-500">비밀번호를 입력하세요.</p>

            <input
              type="password"
              placeholder="비밀번호"
              value={actionPassword}
              onChange={(e) => setActionPassword(e.target.value)}
              className="mt-3 w-full rounded-md border border-zinc-200 px-3 py-1.5 text-sm outline-none focus:border-zinc-400"
              autoFocus
            />

            {actionTarget.action === "edit" && (
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                maxLength={500}
                rows={3}
                className="mt-2 w-full rounded-md border border-zinc-200 px-3 py-1.5 text-sm outline-none focus:border-zinc-400"
              />
            )}

            {actionError && <p className="mt-2 text-xs text-red-500">{actionError}</p>}

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setActionTarget(null)}
                className="rounded-md px-3 py-1.5 text-sm text-zinc-500 hover:bg-zinc-100"
              >
                취소
              </button>
              <button
                onClick={handleAction}
                disabled={!actionPassword.trim()}
                className={`rounded-md px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40 ${
                  actionTarget.action === "delete"
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-zinc-900 hover:bg-zinc-800"
                }`}
              >
                {actionTarget.action === "edit" ? "수정" : "삭제"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
