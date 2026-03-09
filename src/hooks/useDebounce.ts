import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  // In E2E test mode, use 0ms delay for instant updates
  const isE2ETestMode = import.meta.env.VITE_E2E_TEST_MODE === 'true';
  const effectiveDelay = isE2ETestMode ? 0 : delay;

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, effectiveDelay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, effectiveDelay]);

  return debouncedValue;
}
