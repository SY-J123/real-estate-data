"use client";

import { useState, useEffect } from "react";
import HypothesisList from "@/components/hypothesis/HypothesisList";
import HypothesisDetail from "@/components/hypothesis/HypothesisDetail";
import CommentSection from "@/components/hypothesis/CommentSection";
import type { Hypothesis } from "@/types";

export default function HypothesisPage() {
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/data/hypotheses.json")
      .then((res) => res.json())
      .then((data: Hypothesis[]) => {
        setHypotheses(data);
        if (data.length > 0) setSelectedId(data[0].id);
      })
      .catch(() => setHypotheses([]))
      .finally(() => setIsLoading(false));
  }, []);

  const selectedHypothesis = hypotheses.find((h) => h.id === selectedId);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-32">
        <span className="text-sm text-zinc-400">로딩 중...</span>
      </div>
    );
  }

  if (hypotheses.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center py-32">
        <p className="text-sm text-zinc-400">가설 검정 결과가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-8">
      <h1 className="mb-2 text-2xl font-bold text-zinc-900">가설 검정</h1>
      <p className="mb-8 text-sm text-zinc-500">
        부동산 시장에서 흔히 이야기되는 통설들을 실제 거래 데이터와 통계 검정으로 검증합니다.
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <HypothesisList
            hypotheses={hypotheses}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>
        <div className="lg:col-span-2">
          {selectedHypothesis ? (
            <>
              <HypothesisDetail hypothesis={selectedHypothesis} />
              <CommentSection hypothesisId={selectedHypothesis.id} />
            </>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-lg border border-zinc-200 bg-white">
              <span className="text-sm text-zinc-400">
                가설을 선택해주세요.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
