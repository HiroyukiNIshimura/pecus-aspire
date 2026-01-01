'use client';

import type { LinkMatcher } from '@lexical/react/LexicalAutoLinkPlugin';
import { createContext, type ReactNode, useContext, useMemo } from 'react';

/**
 * AutoLinkコンテキストの値
 */
interface AutoLinkContextValue {
  /** カスタムのLinkMatcher配列 */
  customMatchers: LinkMatcher[];
}

const AutoLinkContext = createContext<AutoLinkContextValue>({
  customMatchers: [],
});

/**
 * カスタムMatcherを取得するフック
 */
export function useCustomLinkMatchers(): LinkMatcher[] {
  const context = useContext(AutoLinkContext);
  return context.customMatchers;
}

/**
 * AutoLinkコンテキストのプロバイダー
 */
interface AutoLinkProviderProps {
  children: ReactNode;
  /** カスタムのLinkMatcher配列（BASE_MATCHERSに追加される） */
  customMatchers?: LinkMatcher[];
}

export function AutoLinkProvider({ children, customMatchers = [] }: AutoLinkProviderProps) {
  const value = useMemo(() => ({ customMatchers }), [customMatchers]);
  return <AutoLinkContext.Provider value={value}>{children}</AutoLinkContext.Provider>;
}

// 型のエクスポート
export type { LinkMatcher } from '@lexical/react/LexicalAutoLinkPlugin';
