'use client';

import { createContext, type ReactNode, useContext } from 'react';
import type { AppPublicSettingsResponse, OrganizationPublicSettings, UserPublicSettings } from '@/connectors/api/pecus';

/**
 * アプリケーション公開設定のコンテキスト
 *
 * 組織設定とユーザー設定を統合し、認証済みレイアウトで取得してアプリ全体に配信。
 * APIキーやパスワード等のセンシティブ情報は含まない。
 *
 * @example
 * ```tsx
 * // AI機能の表示制御
 * const isAiEnabled = useIsAiEnabled();
 *
 * // 組織設定のみ取得
 * const { aiProvider } = useOrganizationSettings();
 *
 * // ユーザー設定のみ取得
 * const { timeZone } = useUserSettings();
 * ```
 */
const AppSettingsContext = createContext<AppPublicSettingsResponse | null>(null);

interface AppSettingsProviderProps {
  settings: AppPublicSettingsResponse;
  children: ReactNode;
}

/**
 * アプリケーション設定プロバイダー
 *
 * 認証済みレイアウトでSSR時に設定を取得し、このProviderで配信する。
 */
export function AppSettingsProvider({ settings, children }: AppSettingsProviderProps) {
  return <AppSettingsContext.Provider value={settings}>{children}</AppSettingsContext.Provider>;
}

/**
 * アプリケーション設定を取得するフック
 *
 * @throws {Error} AppSettingsProvider の外で呼び出された場合
 */
export function useAppSettings(): AppPublicSettingsResponse {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error('useAppSettings must be used within AppSettingsProvider');
  }
  return context;
}

// ============================================
// 便利なヘルパーフック
// ============================================

/**
 * AI機能が利用可能かどうかを判定するフック
 *
 * 組織設定でAIプロバイダーがNone以外かつAPIキーが設定済みの場合にtrueを返す。
 *
 * @example
 * ```tsx
 * const isAiEnabled = useIsAiEnabled();
 * return isAiEnabled && <AiSuggestButton />;
 * ```
 */
export function useIsAiEnabled(): boolean {
  const { organization } = useAppSettings();
  return organization.aiProvider !== 'None' && organization.isAiConfigured;
}

/**
 * 組織の公開設定のみ取得するフック
 */
export function useOrganizationSettings(): OrganizationPublicSettings {
  return useAppSettings().organization;
}

/**
 * ユーザーの公開設定のみ取得するフック
 */
export function useUserSettings(): UserPublicSettings {
  return useAppSettings().user;
}

// ============================================
// デフォルト値（エラー時のフォールバック用）
// ============================================

/**
 * アプリケーション設定のデフォルト値
 *
 * API取得に失敗した場合のフォールバック用。
 * AI機能は無効、基本的な設定はデフォルト値を使用。
 */
export const defaultAppSettings: AppPublicSettingsResponse = {
  organization: {
    aiProvider: 'None',
    isAiConfigured: false,
    plan: 'Free',
    requireEstimateOnTaskCreation: false,
    enforcePredecessorCompletion: false,
    groupChatScope: undefined,
    defaultWorkspaceMode: undefined,
  },
  user: {
    timeZone: 'Asia/Tokyo',
    language: 'ja-JP',
    canReceiveEmail: true,
    canReceiveRealtimeNotification: true,
    landingPage: undefined,
    focusScorePriority: 'Deadline',
    focusTasksLimit: 5,
    waitingTasksLimit: 5,
  },
};
