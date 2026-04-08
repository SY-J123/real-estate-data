interface DataTimestampProps {
  lastUpdated: string | null;
}

function formatKST(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
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
