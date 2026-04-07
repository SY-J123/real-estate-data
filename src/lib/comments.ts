import { getSupabase } from "./supabase";
import type { Comment } from "@/types";

// 댓글 목록 조회
export async function fetchComments(hypothesisId: string): Promise<Comment[]> {
  const { data, error } = await getSupabase()
    .from("comments")
    .select("id, hypothesis_id, nickname, content, created_at")
    .eq("hypothesis_id", hypothesisId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

// 댓글 작성
export async function createComment(
  hypothesisId: string,
  nickname: string,
  password: string,
  content: string,
): Promise<Comment> {
  const { data, error } = await getSupabase()
    .from("comments")
    .insert({ hypothesis_id: hypothesisId, nickname, password, content })
    .select("id, hypothesis_id, nickname, content, created_at")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// 비밀번호 확인 (앱 레벨 검증)
async function verifyPassword(commentId: string, password: string): Promise<boolean> {
  const { data } = await getSupabase()
    .from("comments")
    .select("password")
    .eq("id", commentId)
    .single();

  return data?.password === password;
}

// 댓글 수정
export async function updateComment(
  commentId: string,
  password: string,
  content: string,
): Promise<void> {
  const ok = await verifyPassword(commentId, password);
  if (!ok) throw new Error("비밀번호가 일치하지 않습니다.");

  const { error } = await getSupabase()
    .from("comments")
    .update({ content })
    .eq("id", commentId);

  if (error) throw new Error(error.message);
}

// 댓글 삭제
export async function deleteComment(
  commentId: string,
  password: string,
): Promise<void> {
  const ok = await verifyPassword(commentId, password);
  if (!ok) throw new Error("비밀번호가 일치하지 않습니다.");

  const { error } = await getSupabase()
    .from("comments")
    .delete()
    .eq("id", commentId);

  if (error) throw new Error(error.message);
}
