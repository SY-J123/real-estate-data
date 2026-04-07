"use client";

import type { Hypothesis } from "@/types";

interface HypothesisListProps {
  hypotheses: Hypothesis[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const RESULT_BADGE = {
  supported: { label: "지지됨", className: "bg-green-100 text-green-700" },
  rejected: { label: "기각됨", className: "bg-red-100 text-red-700" },
  inconclusive: { label: "불확실", className: "bg-yellow-100 text-yellow-700" },
} as const;

const METHOD_SHORT: Record<string, string> = {
  "independent t-test (Welch)": "t-검정",
  "one-way ANOVA": "ANOVA",
  "Pearson correlation": "상관분석",
};

function getMethodTags(method: string): string[] {
  if (!method) return [];
  return method
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean)
    .map((m) => METHOD_SHORT[m] ?? m);
}

export default function HypothesisList({
  hypotheses,
  selectedId,
  onSelect,
}: HypothesisListProps) {
  return (
    <div className="space-y-3">
      {hypotheses.map((h) => {
        const badge = RESULT_BADGE[h.result];
        const isSelected = h.id === selectedId;
        const tags = getMethodTags(h.method);

        return (
          <button
            key={h.id}
            onClick={() => onSelect(h.id)}
            className={`w-full rounded-lg border p-4 text-left transition-colors ${
              isSelected
                ? "border-zinc-900 bg-zinc-50"
                : "border-zinc-200 bg-white hover:border-zinc-300"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold text-zinc-800">
                {h.title}
              </h3>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}
              >
                {badge.label}
              </span>
            </div>
            {tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
