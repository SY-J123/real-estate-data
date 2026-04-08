"use client";

import { fetchComments, createComment } from "@/lib/comments";
import { useAsyncData } from "@/hooks/useAsyncData";
import type { Comment } from "@/types";
import CommentForm from "./CommentForm";
import CommentList from "./CommentList";

interface CommentSectionProps {
  hypothesisId: string;
}

export default function CommentSection({ hypothesisId }: CommentSectionProps) {
  const { data: comments, isLoading, reload } = useAsyncData<Comment[]>(
    () => fetchComments(hypothesisId).catch(() => []),
    [hypothesisId],
  );

  const handleCreate = async (nickname: string, password: string, content: string) => {
    await createComment(hypothesisId, nickname, password, content);
    reload();
  };

  return (
    <div className="mt-6 rounded-lg border border-border-default bg-bg-card p-6">
      <h3 className="text-sm font-semibold text-text-secondary">
        댓글 {!isLoading && <span className="font-normal text-text-faint">{comments?.length ?? 0}</span>}
      </h3>

      <CommentForm onSubmit={handleCreate} />
      <CommentList comments={comments ?? []} isLoading={isLoading} onChanged={reload} />
    </div>
  );
}
