import { useMemo, useRef } from "react";

export function useDebounce<T extends (...args: never[]) => void>(
  fn: T,
  ms: number,
  maxWait?: number,
) {
  const funcRef = useRef<T | null>(null);
  funcRef.current = fn;

  return useMemo(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let maxWaitTimeoutId: ReturnType<typeof setTimeout> | undefined;
    let lastCallTime: number | undefined;

    const debouncedFn = (...args: Parameters<T>) => {
      const currentTime = Date.now();

      const invokeFunction = () => {
        lastCallTime = undefined;
        if (funcRef.current) {
          funcRef.current(...args);
        }
        clearTimeout(timeoutId);
        clearTimeout(maxWaitTimeoutId);
        timeoutId = undefined;
        maxWaitTimeoutId = undefined;
      };

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      if (maxWait !== undefined) {
        if (lastCallTime === undefined) {
          lastCallTime = currentTime;
          maxWaitTimeoutId = setTimeout(invokeFunction, maxWait);
        } else if (currentTime - lastCallTime >= maxWait) {
          invokeFunction();
          return;
        }
      }

      timeoutId = setTimeout(invokeFunction, ms);
    };

    // Add cancel method
    (debouncedFn as typeof debouncedFn & { cancel: () => void }).cancel =
      () => {
        if (timeoutId) clearTimeout(timeoutId);
        if (maxWaitTimeoutId) clearTimeout(maxWaitTimeoutId);
        timeoutId = undefined;
        maxWaitTimeoutId = undefined;
        lastCallTime = undefined;
      };

    return debouncedFn as typeof debouncedFn & { cancel: () => void };
  }, [ms, maxWait]);
}
