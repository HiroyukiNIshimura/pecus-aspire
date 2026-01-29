'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface UseAiSuggestionReturn {
  /** ローディング中かどうか */
  isLoading: boolean;
  /** ローディングを開始する */
  startLoading: () => void;
  /** ローディングを終了する */
  finishLoading: () => void;
  /** 処理をキャンセルする */
  cancel: () => void;
  /** キャンセルされたかどうかをチェックする（非同期処理内で使用） */
  checkCancelled: () => boolean;
}

/**
 * AI提案処理のローディング状態とキャンセル機能を管理するフック
 *
 * 使用例:
 * ```tsx
 * const { isLoading, startLoading, finishLoading, cancel, checkCancelled } = useAiSuggestion();
 *
 * const handleSuggest = async () => {
 *   startLoading();
 *   try {
 *     const result = await fetchSuggestion();
 *     if (checkCancelled()) return; // キャンセルされていたら結果を無視
 *     // 結果を処理
 *   } catch (err) {
 *     if (checkCancelled()) return;
 *     // エラー処理
 *   } finally {
 *     if (!checkCancelled()) finishLoading();
 *   }
 * };
 *
 * return (
 *   <AiProgressOverlay isVisible={isLoading} message="生成中..." onCancel={cancel} />
 * );
 * ```
 */
export function useAiSuggestion(): UseAiSuggestionReturn {
  const [isLoading, setIsLoading] = useState(false);
  const cancelledRef = useRef(false);

  // ローディング開始時にキャンセルフラグをリセット
  const startLoading = useCallback(() => {
    cancelledRef.current = false;
    setIsLoading(true);
  }, []);

  // ローディング終了
  const finishLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  // キャンセル処理
  const cancel = useCallback(() => {
    if (isLoading) {
      cancelledRef.current = true;
      setIsLoading(false);
    }
  }, [isLoading]);

  // キャンセル状態をチェック
  const checkCancelled = useCallback(() => {
    return cancelledRef.current;
  }, []);

  // Escキーでキャンセル
  useEffect(() => {
    if (!isLoading) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        cancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isLoading, cancel]);

  return {
    isLoading,
    startLoading,
    finishLoading,
    cancel,
    checkCancelled,
  };
}
