"use client";

import Card from "@/components/ui/Card";

export default function UnsoldChart() {
  return (
    <Card className="relative">
      <h3 className="mb-4 text-sm font-semibold text-zinc-700">
        서울 미분양 현황 (월별)
      </h3>
      <div className="h-[300px]" />

      {/* 준비중 오버레이 */}
      <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/80 backdrop-blur-[2px]">
        <div className="text-center">
          <p className="text-lg font-semibold text-zinc-400">준비중</p>
          <p className="mt-1 text-xs text-zinc-400">데이터 확보 후 제공 예정</p>
        </div>
      </div>
    </Card>
  );
}
