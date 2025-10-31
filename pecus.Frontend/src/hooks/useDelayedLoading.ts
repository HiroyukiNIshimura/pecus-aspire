import { useState, useCallback } from 'react';

interface UseDelayedLoadingOptions {
  /**ローディング表示の遅延時間（ms） */
  delayMs?: number;
  /**最小表示時間（ms） */
  minDisplayTimeMs?: number;
}

interface UseDelayedLoadingReturn {
  /**実際に表示するべきローディング状態 */
  showLoading: boolean;
  /**内部の処理中状態 */
  isLoading: boolean;
  /**async 関数をラップして遅延ロジックを適用 */
  withDelayedLoading: <T extends any[], R>(
    fn: (...args: T) => Promise<void>
  ) => (...args: T) => Promise<void>;
}

/**
 * サーバーレスポンスが速い場合のローディング画面のちらつきを防ぐ custom hook
 *
 * @param options.delayMs - ローディング表示の遅延時間（デフォルト: 200ms）
 * @param options.minDisplayTimeMs - 最小表示時間（デフォルト: 300ms）
 * @returns showLoading, isLoading, withDelayedLoading
 *
 * @example
 * const { showLoading, withDelayedLoading } = useDelayedLoading();
 * const handleFetch = withDelayedLoading(async () => {
 *   const data = await fetch('/api/data');
 *   setData(data);
 * });
 *
 * return (
 *   <>
 *     {showLoading && <LoadingSpinner />}
 *     <button onClick={handleFetch}>Fetch</button>
 *   </>
 * );
 */
export function useDelayedLoading(
  options: UseDelayedLoadingOptions = {}
): UseDelayedLoadingReturn {
  const { delayMs = 200, minDisplayTimeMs = 300 } = options;
  const [isLoading, setIsLoading] = useState(false);
  const [showLoading, setShowLoading] = useState(false);

  const withDelayedLoading = useCallback(
    <T extends any[]>(fn: (...args: T) => Promise<void>) => {
      return async (...args: T) => {
        try {
          setIsLoading(true);

          // 遅延してローディング表示を開始
          const showLoadingTimer = setTimeout(() => {
            setShowLoading(true);
          }, delayMs);

          const startTime = Date.now();

          // 実際の処理を実行
          await fn(...args);

          // 最小表示時間を保証
          const elapsed = Date.now() - startTime;
          if (elapsed < minDisplayTimeMs) {
            await new Promise(resolve =>
              setTimeout(resolve, minDisplayTimeMs - elapsed)
            );
          }

          clearTimeout(showLoadingTimer);
        } finally {
          setIsLoading(false);
          setShowLoading(false);
        }
      };
    },
    [delayMs, minDisplayTimeMs]
  );

  return { showLoading, isLoading, withDelayedLoading };
}
