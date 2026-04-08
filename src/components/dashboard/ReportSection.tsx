"use client";

import { useState } from "react";
import { fetchReports } from "@/lib/reports";
import { useAsyncData } from "@/hooks/useAsyncData";
import Card from "@/components/ui/Card";
import type { Report } from "@/types";
import ReportForm from "./ReportForm";
import ReportList from "./ReportList";

export default function ReportSection() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: reports, reload } = useAsyncData<Report[]>(
    () => fetchReports().catch(() => []),
    [],
  );

  const handleCreated = () => {
    setIsOpen(false);
    reload();
  };

  return (
    <Card>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-700">
          오류 제보
          {(reports?.length ?? 0) > 0 && (
            <span className="ml-1.5 text-xs font-normal text-zinc-400">
              {reports!.length}건
            </span>
          )}
        </h3>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700"
        >
          {isOpen ? "취소" : "제보하기"}
        </button>
      </div>

      {isOpen && <ReportForm onCreated={handleCreated} onCancel={() => setIsOpen(false)} />}
      <ReportList reports={reports ?? []} onChanged={reload} />
    </Card>
  );
}
