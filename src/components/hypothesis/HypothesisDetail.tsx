"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
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

function formatValue(v: number) {
  if (v >= 10000) return `${(v / 10000).toFixed(0)}만`;
  return v.toLocaleString();
}

export default function HypothesisDetail({ hypothesis }: HypothesisDetailProps) {
  const { title, description, method, result, pValue, testStat, chartData, chartType, lineCharts, chartGroups, details } = hypothesis;

  return (
    <div className="rounded-lg border border-border-default bg-bg-card p-6">
      <h2 className="text-lg font-bold text-text-primary">{title}</h2>
      <p className="mt-2 text-sm text-text-tertiary">{description}</p>

      {/* 검정 방법 */}
      <div className="mt-4 flex items-center gap-2">
        <span className="rounded bg-bg-muted px-2 py-1 text-xs font-medium text-text-tertiary">
          {METHOD_LABELS[method] ?? method}
        </span>
      </div>

      {/* 차트 */}
      {chartType === "multi_overlay" && chartGroups && chartGroups.length > 0 ? (
        <div className="mt-6 space-y-6">
          {chartGroups.map((group) => (
            <div key={group.title}>
              <h4 className="mb-2 text-sm font-semibold text-text-secondary">{group.title}</h4>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={group.lineCharts[0]?.data.map((d, i) => {
                  const point: Record<string, unknown> = { date: d.date };
                  group.lineCharts.forEach((panel) => { point[panel.title] = panel.data[i]?.value; });
                  return point;
                }) ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11 }} domain={["dataMin - 5", "dataMax + 5"]} />
                  <Tooltip formatter={(v) => `${Number(v).toFixed(1)}`} />
                  <Legend />
                  {group.lineCharts.map((panel) => (
                    <Line key={panel.title} type="monotone" dataKey={panel.title} stroke={panel.color} strokeWidth={2} dot={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      ) : chartType === "overlay" && lineCharts && lineCharts.length > 0 ? (
        <div className="mt-6">
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={lineCharts[0].data.map((d, i) => {
              const point: Record<string, unknown> = { date: d.date };
              lineCharts.forEach((panel) => { point[panel.title] = panel.data[i]?.value; });
              return point;
            })}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} domain={["dataMin - 2", "dataMax + 2"]} />
              <Tooltip formatter={(v) => Number(v).toFixed(1)} />
              <Legend />
              {lineCharts.map((panel) => (
                <Line key={panel.title} type="monotone" dataKey={panel.title} stroke={panel.color} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : chartType === "line" && lineCharts && lineCharts.length > 0 ? (
        <div className="mt-6 space-y-4">
          {lineCharts.map((panel) => {
            const values = panel.data.map((d) => d.value);
            const min = Math.min(...values);
            const max = Math.max(...values);
            const padding = Math.max(Math.round((max - min) * 0.1), 1);
            return (
              <div key={panel.title}>
                <h4 className="mb-1 text-xs font-semibold text-text-muted">{panel.title}</h4>
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={panel.data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={formatValue} domain={[min - padding, max + padding]} />
                    <Tooltip formatter={(v) => formatValue(Number(v))} />
                    <Line type="monotone" dataKey="value" stroke={panel.color} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            );
          })}
        </div>
      ) : chartData.length > 0 ? (
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
      ) : null}

      {/* 검정 결과 — 통계 검정이 수행된 가설만 표시 */}
      {pValue > 0 && (
        <>
          <div className={`mt-6 rounded-md border p-4 ${RESULT_STYLE[result]}`}>
            <h4 className="text-sm font-semibold text-text-secondary">검정 결과</h4>
            <p className="mt-1 text-sm text-text-tertiary">{RESULT_TEXT[result]}</p>
            <div className="mt-2 flex flex-wrap gap-4 text-xs text-text-muted">
              <span>p-value: <strong>{pValue.toFixed(4)}</strong></span>
              <span>검정통계량: <strong>{testStat.toFixed(4)}</strong></span>
              <span>유의수준: 0.05</span>
            </div>
          </div>

          {details && Object.keys(details).length > 0 && (
            <details className="mt-4">
              <summary className="cursor-pointer text-xs font-medium text-text-faint hover:text-text-tertiary">
                상세 통계 보기
              </summary>
              <div className="mt-2 rounded bg-bg-base p-3">
                <dl className="grid grid-cols-2 gap-2 text-xs text-text-tertiary">
                  {Object.entries(details).map(([key, value]) => (
                    <div key={key}>
                      <dt className="font-medium text-text-muted">{key}</dt>
                      <dd>{typeof value === "object" ? JSON.stringify(value) : String(value)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </details>
          )}
        </>
      )}
    </div>
  );
}
