'use client';

import { createContext, type ReactNode, useContext, useMemo } from 'react';

/**
 * AutoLink設定の型
 * アイテムコード（#123 など）をリンクに変換するための設定
 */
export interface AutoLinkSettings {
  /** ベースURL（リンク生成用） */
  baseUrl?: string;
  /** ワークスペースID（アイテムコードリンク生成用） */
  workspaceId?: number;
}

/**
 * AutoLinkコンテキストの値
 */
interface AutoLinkContextValue {
  settings: AutoLinkSettings;
}

const AutoLinkContext = createContext<AutoLinkContextValue>({
  settings: {},
});

/**
 * AutoLink設定を取得するフック
 */
export function useAutoLinkSettings(): AutoLinkSettings {
  const context = useContext(AutoLinkContext);
  return context.settings;
}

/**
 * AutoLinkコンテキストのプロバイダー
 */
interface AutoLinkProviderProps {
  children: ReactNode;
  settings?: AutoLinkSettings;
}

export function AutoLinkProvider({ children, settings = {} }: AutoLinkProviderProps) {
  const value = useMemo(() => ({ settings }), [settings]);
  return <AutoLinkContext.Provider value={value}>{children}</AutoLinkContext.Provider>;
}
