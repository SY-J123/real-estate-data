import { useState, useEffect, useCallback, type DependencyList } from "react";

interface UseAsyncDataResult<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  reload: () => void;
}

export function useAsyncData<T>(
  fetchFn: () => Promise<T>,
  deps: DependencyList = [],
): UseAsyncDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "데이터를 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    load();
  }, [load]);

  return { data, isLoading, error, reload: load };
}
