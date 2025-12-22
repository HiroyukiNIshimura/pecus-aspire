import { createPecusApiClients, parseErrorResponse } from '@/connectors/api/PecusApiClient';
import type { UserSettingResponse } from '@/connectors/api/pecus';
import UserSettingsClient from './UserSettingsClient';

export const dynamic = 'force-dynamic';

/**
 * ユーザー設定ページ（Server Component）
 * SSR で初期データを取得し、Client Component へプロップスで渡す
 */
export default async function UserSettingsPage() {
  let userSettings: UserSettingResponse | null = null;
  let fetchError: string | null = null;

  try {
    const api = createPecusApiClients();

    // ユーザー設定を取得
    const userResponse = await api.profile.getApiProfile();
    userSettings = userResponse.setting ?? null;
  } catch (error) {
    console.error('Failed to fetch user settings data:', error);
    fetchError = parseErrorResponse(error, 'ユーザー設定情報の取得に失敗しました').message;
  }

  // 設定が取得できない場合はデフォルト値を使用
  const defaultSettings: UserSettingResponse = {
    rowVersion: 0,
    canReceiveEmail: true,
    canReceiveRealtimeNotification: true,
    timeZone: 'Asia/Tokyo',
    language: 'ja-JP',
    focusTasksLimit: 5,
    waitingTasksLimit: 5,
  };

  return <UserSettingsClient initialSettings={userSettings ?? defaultSettings} fetchError={fetchError} />;
}
