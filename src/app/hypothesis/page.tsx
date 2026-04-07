"use client";

import { useState, useEffect } from "react";
import { fetchHypotheses } from "@/lib/api";
import HypothesisList from "@/components/hypothesis/HypothesisList";
import HypothesisDetail from "@/components/hypothesis/HypothesisDetail";
import type { Hypothesis } from "@/types";

export default function HypothesisPage() {
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHypotheses()
      .then((data) => {
        setHypotheses(data);
        if (data.length > 0) setSelectedId(data[0].id);
      })
      .catch((err) => setError(err.message))
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

  if (error || hypotheses.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center py-32">
        <p className="text-sm text-zinc-400">
          {error ?? "가설 검정 결과가 없습니다. 데이터 수집 후 다시 확인해주세요."}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-8">
      <h1 className="mb-2 text-2xl font-bold text-zinc-900">가설 검정</h1>
      <p className="mb-8 text-sm text-zinc-500">
        부동산 시장에서 흔히 이야기되는 통설들을 실제 거래 데이터와 통계 검정(t-test, ANOVA, 상관분석)으로 검증합니다.
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
            <HypothesisDetail hypothesis={selectedHypothesis} />
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
