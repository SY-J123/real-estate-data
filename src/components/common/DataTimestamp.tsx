interface DataTimestampProps {
  lastUpdated: string | null;
}

export default function DataTimestamp({ lastUpdated }: DataTimestampProps) {
  if (!lastUpdated) return null;

  return (
    <p className="text-xs text-zinc-400">
      데이터 기준: {lastUpdated}
    </p>
  );
}
