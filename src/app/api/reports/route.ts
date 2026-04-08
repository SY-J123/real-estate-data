import { type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.SUPABASE_SERVICE_KEY ?? "",
  );
}

// IP 기반 in-memory rate limit
const ipLog = new Map<string, number[]>();
const IP_LIMIT = 10; // 시간당 최대 10건
const IP_WINDOW = 60 * 60 * 1000; // 1시간

function checkIpLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = (ipLog.get(ip) ?? []).filter((t) => now - t < IP_WINDOW);
  if (timestamps.length >= IP_LIMIT) return false;
  timestamps.push(now);
  ipLog.set(ip, timestamps);
  return true;
}

// 오래된 항목 정리 (5분마다)
setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamps] of ipLog) {
    const valid = timestamps.filter((t) => now - t < IP_WINDOW);
    if (valid.length === 0) ipLog.delete(ip);
    else ipLog.set(ip, valid);
  }
}, 5 * 60 * 1000);

export async function GET() {
  const { data, error } = await getSupabase()
    .from("reports")
    .select("id, gu, category, nickname, content, status, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json(data);
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (!checkIpLimit(ip)) {
    return Response.json(
      { error: "너무 많은 요청입니다. 1시간 후 다시 시도해주세요." },
      { status: 429 },
    );
  }

  const body = await request.json();
  const { gu, category, nickname, password, content } = body;

  if (!gu || !category || !nickname || !password || !content) {
    return Response.json({ error: "필수 항목이 누락되었습니다." }, { status: 400 });
  }
  if (nickname.length > 20 || password.length < 4 || content.length > 500) {
    return Response.json({ error: "입력값이 올바르지 않습니다." }, { status: 400 });
  }

  const { data, error } = await getSupabase()
    .from("reports")
    .insert({ gu, category, nickname, password, content })
    .select("id, gu, category, nickname, content, status, created_at")
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json(data, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (!checkIpLimit(ip)) {
    return Response.json(
      { error: "너무 많은 요청입니다. 1시간 후 다시 시도해주세요." },
      { status: 429 },
    );
  }

  const body = await request.json();
  const { reportId, password } = body;

  if (!reportId || !password) {
    return Response.json({ error: "필수 항목이 누락되었습니다." }, { status: 400 });
  }

  // 비밀번호 검증 (서버에서 처리 — 클라이언트에 password 노출 안 함)
  const { data: existing } = await getSupabase()
    .from("reports")
    .select("password")
    .eq("id", reportId)
    .single();

  if (!existing || existing.password !== password) {
    return Response.json(
      { error: "비밀번호가 일치하지 않습니다." },
      { status: 403 },
    );
  }

  const { error } = await getSupabase().from("reports").delete().eq("id", reportId);
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json({ ok: true });
}
