import { type DependencyList, useEffect, useRef } from "react";

/**
 * useEffect の初回マウント時実行スキップ版
 *
 * SSR + Client Component パターンで、初回マウント時は実行せず、
 * その後の依存配列変更時のみ効果を実行したい場合に使用
 *
 * @param effect - 実行する副作用関数
 * @param deps - 依存配列
 *
 * @example
 * useEffectAfterMount(() => {
 *   handleFilterChange();
 * }, [filterGenreId, filterIsActive]);
 */
export const useEffectAfterMount = (effect: () => undefined | (() => void), deps?: DependencyList) => {
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    effect();
  }, deps);
};
