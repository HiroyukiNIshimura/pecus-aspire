import { createPecusApiClients, getUserSafeErrorMessage } from '@/connectors/api/PecusApiClient';
import type {
  OrganizationPublicSettings,
  UserSettingResponse,
  WorkspaceListItemResponse,
} from '@/connectors/api/pecus';
import UserSettingsClient from './UserSettingsClient';

export const dynamic = 'force-dynamic';

/**
 * ユーザー設定ページ（Server Component）
 * SSR で初期データを取得し、Client Component へプロップスで渡す
 */
export default async function UserSettingsPage() {
  let userSettings: UserSettingResponse | null = null;
  let organizationSetting: OrganizationPublicSettings | null = null;
  let workspaces: WorkspaceListItemResponse[] = [];
  let fetchError: string | null = null;

  try {
    const api = createPecusApiClients();

    // ユーザー設定を取得
    const userResponse = await api.profile.getApiProfile();
    userSettings = userResponse.setting ?? null;

    // 組織設定を取得（ゲーミフィケーション設定のため）
    const appSettings = await api.profile.getApiProfileAppSettings();
    organizationSetting = appSettings.organization ?? null;

    // ワークスペース一覧を取得（メール通知フィルタ用）
    const workspacesResponse = await api.workspace.getApiWorkspaces();
    workspaces = workspacesResponse.data ?? [];
  } catch (error) {
    console.error('Failed to fetch user settings data:', error);
    fetchError = getUserSafeErrorMessage(error, 'ユーザー設定情報の取得に失敗しました');
  }

  // 設定が取得できない場合はデフォルト値を使用
  const defaultSettings: UserSettingResponse = {
    rowVersion: 0,
    canReceiveEmail: true,
    emailNotificationMode: 'Standard',
    canReceiveWeeklyReport: false,
    canReceiveRealtimeNotification: true,
    timeZone: 'Asia/Tokyo',
    language: 'ja-JP',
    focusTasksLimit: 5,
    waitingTasksLimit: 5,
  };

  return (
    <UserSettingsClient
      initialSettings={userSettings ?? defaultSettings}
      organizationSetting={organizationSetting}
      workspaces={workspaces}
      fetchError={fetchError}
    />
  );
}
