import type { Report } from "@/types";

export type { Report };

export async function fetchReports(): Promise<Report[]> {
  const res = await fetch("/api/reports");
  if (!res.ok) return [];
  return res.json();
}

export async function createReport(
  gu: string,
  category: string,
  nickname: string,
  password: string,
  content: string,
): Promise<Report> {
  const res = await fetch("/api/reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ gu, category, nickname, password, content }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "제보 실패");
  return data;
}

export async function deleteReport(
  reportId: string,
  password: string,
): Promise<void> {
  const res = await fetch("/api/reports", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reportId, password }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error ?? "삭제 실패");
  }
}
