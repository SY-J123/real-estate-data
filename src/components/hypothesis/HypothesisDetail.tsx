"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { Hypothesis } from "@/types";

interface HypothesisDetailProps {
  hypothesis: Hypothesis;
}

const RESULT_TEXT = {
  supported: "데이터가 이 가설을 통계적으로 지지합니다.",
  rejected: "데이터가 이 가설을 기각합니다.",
  inconclusive: "통계적으로 유의미한 결론을 내리기 어렵습니다.",
} as const;

const RESULT_STYLE = {
  supported: "border-green-200 bg-green-50",
  rejected: "border-red-200 bg-red-50",
  inconclusive: "border-yellow-200 bg-yellow-50",
} as const;

const METHOD_LABELS: Record<string, string> = {
  "independent t-test (Welch)": "독립표본 t-검정 (Welch)",
  "one-way ANOVA": "일원분산분석 (ANOVA)",
  "Pearson correlation": "피어슨 상관분석",
};

export default function HypothesisDetail({ hypothesis }: HypothesisDetailProps) {
  const { title, description, method, result, pValue, testStat, chartData, details } = hypothesis;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6">
      <h2 className="text-lg font-bold text-zinc-900">{title}</h2>
      <p className="mt-2 text-sm text-zinc-600">{description}</p>

      {/* 검정 방법 */}
      <div className="mt-4 flex items-center gap-2">
        <span className="rounded bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600">
          {METHOD_LABELS[method] ?? method}
        </span>
      </div>

      {/* 차트 */}
      {chartData.length > 0 && (
        <div className="mt-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="groupA" name="그룹 A" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="groupB" name="그룹 B" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 검정 결과 */}
      <div className={`mt-6 rounded-md border p-4 ${RESULT_STYLE[result]}`}>
        <h4 className="text-sm font-semibold text-zinc-700">검정 결과</h4>
        <p className="mt-1 text-sm text-zinc-600">{RESULT_TEXT[result]}</p>
        <div className="mt-2 flex flex-wrap gap-4 text-xs text-zinc-500">
          <span>p-value: <strong>{pValue.toFixed(4)}</strong></span>
          <span>검정통계량: <strong>{testStat.toFixed(4)}</strong></span>
          <span>유의수준: 0.05</span>
        </div>
      </div>

      {/* 상세 정보 */}
      {details && Object.keys(details).length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-xs font-medium text-zinc-400 hover:text-zinc-600">
            상세 통계 보기
          </summary>
          <div className="mt-2 rounded bg-zinc-50 p-3">
            <dl className="grid grid-cols-2 gap-2 text-xs text-zinc-600">
              {Object.entries(details).map(([key, value]) => (
                <div key={key}>
                  <dt className="font-medium text-zinc-500">{key}</dt>
                  <dd>{typeof value === "object" ? JSON.stringify(value) : String(value)}</dd>
                </div>
              ))}
            </dl>
          </div>
        </details>
      )}
    </div>
  );
}
