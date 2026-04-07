interface DataTimestampProps {
  lastUpdated: string | null;
}

function formatKST(isoString: string): string {
  const date = new Date(isoString);
  // DB에 UTC로 저장되지만 timezone 정보가 없으므로 +9시간
  date.setHours(date.getHours() + 9);
  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DataTimestamp({ lastUpdated }: DataTimestampProps) {
  if (!lastUpdated) return null;

  return (
    <p className="text-xs text-zinc-400">
      데이터 기준: {formatKST(lastUpdated)}
    </p>
  );
}
