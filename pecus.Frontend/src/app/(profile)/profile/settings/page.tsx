import { getUserSafeErrorMessage } from "@/connectors/api/PecusApiClient";
import {
  getProfileAppSettingsWithHeyApi,
  getProfileWithHeyApi,
  getWorkspacesWithHeyApi,
} from "@/connectors/HeyApiClient";
import type {
  OrganizationPublicSettings,
  UserSettingResponse,
  WorkspaceListItemResponse,
} from "@/connectors/api/pecus";
import type {
  UserSettingResponse as HeyUserSettingResponse,
  WorkspaceListItemResponse as HeyWorkspaceListItemResponse,
} from "@/connectors/hey-api-axios/types.gen";
import UserSettingsClient from "./UserSettingsClient";

export const dynamic = "force-dynamic";

function normalizeUserSettings(
  setting: HeyUserSettingResponse,
): UserSettingResponse {
  return {
    ...setting,
    emailNotificationMode: setting.emailNotificationMode ?? undefined,
    landingPage: setting.landingPage ?? undefined,
    focusScorePriority: setting.focusScorePriority ?? undefined,
    badgeVisibility: setting.badgeVisibility ?? undefined,
    pendingLandingPageRecommendation:
      setting.pendingLandingPageRecommendation ?? undefined,
  };
}

function normalizeWorkspaceForSettings(
  workspace: HeyWorkspaceListItemResponse,
): WorkspaceListItemResponse {
  return {
    id: workspace.id,
    name: workspace.name,
    code: workspace.code ?? undefined,
  };
}

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
    // ユーザー設定を取得
    const userResponse = await getProfileWithHeyApi();
    userSettings = userResponse.setting
      ? normalizeUserSettings(userResponse.setting)
      : null;

    // 組織設定を取得（ゲーミフィケーション設定のため）
    const appSettings = await getProfileAppSettingsWithHeyApi();
    organizationSetting = appSettings.organization ?? null;

    // ワークスペース一覧を取得（メール通知フィルタ用）
    const workspacesResponse = await getWorkspacesWithHeyApi();
    workspaces = workspacesResponse.data.map(normalizeWorkspaceForSettings);
  } catch (error) {
    console.error("Failed to fetch user settings data:", error);
    fetchError = getUserSafeErrorMessage(
      error,
      "ユーザー設定情報の取得に失敗しました",
    );
  }

  // 設定が取得できない場合はデフォルト値を使用
  const defaultSettings: UserSettingResponse = {
    rowVersion: 0,
    canReceiveEmail: true,
    emailNotificationMode: "Standard",
    canReceiveWeeklyReport: false,
    canReceiveRealtimeNotification: true,
    timeZone: "Asia/Tokyo",
    language: "ja-JP",
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
