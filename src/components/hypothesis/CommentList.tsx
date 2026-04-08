"use client";

import { useState } from "react";
import { updateComment, deleteComment } from "@/lib/comments";
import { timeAgo } from "@/lib/timeAgo";
import ConfirmModal from "@/components/ui/ConfirmModal";
import type { Comment } from "@/types";

interface CommentListProps {
  comments: Comment[];
  isLoading: boolean;
  onChanged: () => void;
}

export default function CommentList({ comments, isLoading, onChanged }: CommentListProps) {
  const [actionTarget, setActionTarget] = useState<{ id: string; action: "edit" | "delete" } | null>(null);
  const [actionPassword, setActionPassword] = useState("");
  const [editContent, setEditContent] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

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
      onChanged();
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
    <>
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

      <ConfirmModal
        isOpen={!!actionTarget}
        title={actionTarget?.action === "edit" ? "댓글 수정" : "댓글 삭제"}
        message="비밀번호를 입력하세요."
        confirmLabel={actionTarget?.action === "edit" ? "수정" : "삭제"}
        variant={actionTarget?.action === "delete" ? "danger" : "default"}
        onConfirm={handleAction}
        onCancel={() => setActionTarget(null)}
      >
        <input
          type="password"
          placeholder="비밀번호"
          value={actionPassword}
          onChange={(e) => setActionPassword(e.target.value)}
          className="mt-3 w-full rounded-md border border-zinc-200 px-3 py-1.5 text-sm outline-none focus:border-zinc-400"
          autoFocus
        />
        {actionTarget?.action === "edit" && (
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            maxLength={500}
            rows={3}
            className="mt-2 w-full rounded-md border border-zinc-200 px-3 py-1.5 text-sm outline-none focus:border-zinc-400"
          />
        )}
        {actionError && <p className="mt-2 text-xs text-red-500">{actionError}</p>}
      </ConfirmModal>
    </>
  );
}
