'use client';

import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import type {
  AppPublicSettingsResponse,
  CurrentUserInfo,
  LimitsSettings,
  OrganizationPublicSettings,
  UserPublicSettings,
} from '@/connectors/api/pecus';

// 自動生成された型を再エクスポート
export type { CurrentUserInfo } from '@/connectors/api/pecus';

/**
 * アプリケーション設定コンテキストの値型
 */
interface AppSettingsContextValue {
  settings: AppPublicSettingsResponse;
  updateCurrentUser: (updates: Partial<CurrentUserInfo>) => void;
}

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
 *
 * // 現在のユーザー情報を取得
 * const currentUser = useCurrentUser();
 *
 * // 現在のユーザー情報を更新（プロフィール変更時）
 * const { updateCurrentUser } = useUpdateCurrentUser();
 * updateCurrentUser({ identityIconUrl: newUrl });
 * ```
 */
const AppSettingsContext = createContext<AppSettingsContextValue | null>(null);

interface AppSettingsProviderProps {
  settings: AppPublicSettingsResponse;
  children: ReactNode;
}

/**
 * アプリケーション設定プロバイダー
 *
 * 認証済みレイアウトでSSR時に設定を取得し、このProviderで配信する。
 */
export function AppSettingsProvider({ settings: initialSettings, children }: AppSettingsProviderProps) {
  const [settings, setSettings] = useState<AppPublicSettingsResponse>(initialSettings);

  const updateCurrentUser = useCallback((updates: Partial<CurrentUserInfo>) => {
    setSettings((prev) => ({
      ...prev,
      currentUser: {
        ...prev.currentUser,
        ...updates,
      },
    }));
  }, []);

  const contextValue = useMemo<AppSettingsContextValue>(
    () => ({
      settings,
      updateCurrentUser,
    }),
    [settings, updateCurrentUser],
  );

  return <AppSettingsContext.Provider value={contextValue}>{children}</AppSettingsContext.Provider>;
}

/**
 * アプリケーション設定コンテキストを取得する内部フック
 */
function useAppSettingsContext(): AppSettingsContextValue {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error('useAppSettings must be used within AppSettingsProvider');
  }
  return context;
}

/**
 * アプリケーション設定を取得するフック
 *
 * @throws {Error} AppSettingsProvider の外で呼び出された場合
 */
export function useAppSettings(): AppPublicSettingsResponse {
  return useAppSettingsContext().settings;
}

/**
 * 現在のユーザー情報を更新するフック
 *
 * プロフィール更新時にヘッダー等の表示を即時反映するために使用。
 *
 * @example
 * ```tsx
 * const { updateCurrentUser } = useUpdateCurrentUser();
 * updateCurrentUser({ identityIconUrl: newUrl, username: newName });
 * ```
 */
export function useUpdateCurrentUser(): { updateCurrentUser: (updates: Partial<CurrentUserInfo>) => void } {
  const { updateCurrentUser } = useAppSettingsContext();
  return { updateCurrentUser };
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

/**
 * 制限設定を取得するフック
 */
export function useLimitsSettings(): LimitsSettings {
  return useAppSettings().limits;
}

/**
 * 現在のユーザー情報を取得するフック
 *
 * @returns 現在のユーザー情報
 * @throws {Error} AppSettingsProvider の外で呼び出された場合
 *
 * @example
 * ```tsx
 * const currentUser = useCurrentUser();
 * console.log(currentUser.id, currentUser.username);
 * ```
 */
export function useCurrentUser(): CurrentUserInfo {
  return useAppSettings().currentUser;
}

/**
 * 現在のユーザーIDを取得するフック
 *
 * @returns 現在のユーザーID
 *
 * @example
 * ```tsx
 * const currentUserId = useCurrentUserId();
 * const isOwn = comment.userId === currentUserId;
 * ```
 */
export function useCurrentUserId(): number {
  return useCurrentUser().id;
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
  currentUser: {
    id: 0,
    organizationId: 0,
    username: '',
    email: '',
    identityIconUrl: null,
    isAdmin: false,
    isBackOffice: false,
  },
  organization: {
    aiProvider: 'None',
    isAiConfigured: false,
    plan: 'Free',
    requireEstimateOnTaskCreation: false,
    enforcePredecessorCompletion: false,
    groupChatScope: undefined,
    defaultWorkspaceMode: undefined,
    gamificationEnabled: true,
    gamificationBadgeVisibility: 'Private',
    gamificationAllowUserOverride: true,
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
  limits: {
    maxTagsPerOrganization: 100,
    maxSkillsPerOrganization: 100,
    maxDocumentsPerWorkspace: 100,
  },
};
