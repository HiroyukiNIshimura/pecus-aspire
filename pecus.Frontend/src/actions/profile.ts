'use server';

import {
  createAuthenticatedAxios,
  createPecusApiClients,
  detectConcurrencyError,
} from '@/connectors/api/PecusApiClient';
import type {
  AppPublicSettingsResponse,
  AvatarType,
  EmailChangeRequestResponse,
  EmailChangeVerifyResponse,
  FocusScorePriority,
  LandingPage,
  MessageResponse,
  SuccessResponse,
  UserDetailResponse,
  UserSettingResponse,
} from '@/connectors/api/pecus';
import type { UpdateEmailFormInput, UpdatePasswordFormInput, UpdateSkillsFormInput } from '@/schemas/profileSchemas';
import { handleApiErrorForAction } from './apiErrorPolicy';
import type { ApiResponse } from './types';

/**
 * Server Action: プロフィールを更新（ユーザー名、アバター）
 * 楽観的ロックで競合を検出
 */
export async function updateProfile(request: {
  username?: string;
  avatarType?: AvatarType;
  userAvatarPath?: string;
  skillIds?: number[];
  rowVersion: number; // 楽観的ロック用（PostgreSQL xmin）
}): Promise<ApiResponse<UserDetailResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.profile.putApiProfile({
      username: request.username,
      avatarType: request.avatarType,
      userAvatarPath: request.userAvatarPath,
      skillIds: request.skillIds,
      rowVersion: request.rowVersion,
    });
    return { success: true, data: response };
  } catch (error) {
    // 409 Conflict（並行更新）を検出
    const concurrencyError = detectConcurrencyError(error);
    if (concurrencyError) {
      const payload = concurrencyError.payload ?? {};
      const current = payload.current as UserDetailResponse | undefined;
      return {
        success: false,
        error: 'conflict',
        message: concurrencyError.message,
        latest: {
          type: 'user',
          data: current as UserDetailResponse,
        },
      };
    }

    console.error('Failed to update profile:', error);
    return handleApiErrorForAction<UserDetailResponse>(error, {
      defaultMessage: 'プロフィールの更新に失敗しました',
    });
  }
}

/**
 * Server Action: メールアドレス変更をリクエスト
 * @param input クライアント側で Zod 検証済みのデータ
 */
export async function requestEmailChange(
  input: UpdateEmailFormInput,
): Promise<ApiResponse<EmailChangeRequestResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.profile.postApiProfileEmailRequestChange({
      newEmail: input.newEmail,
      currentPassword: input.currentPassword,
    });

    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to request email change:', error);
    return handleApiErrorForAction<EmailChangeRequestResponse>(error, {
      defaultMessage: 'メールアドレス変更リクエストに失敗しました',
    });
  }
}

/**
 * Server Action: メールアドレス変更を確認（トークン検証）
 * @param token 確認トークン
 */
export async function verifyEmailChange(token: string): Promise<ApiResponse<EmailChangeVerifyResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.profile.getApiProfileEmailVerify(token);

    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to verify email change:', error);
    return handleApiErrorForAction<EmailChangeVerifyResponse>(error, {
      defaultMessage: 'メールアドレス変更の確認に失敗しました',
    });
  }
}

/**
 * Server Action: パスワードを変更
 * @param input クライアント側で Zod 検証済みのデータ
 */
export async function updateUserPassword(input: UpdatePasswordFormInput): Promise<ApiResponse<MessageResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.profile.patchApiProfilePassword({
      currentPassword: input.currentPassword,
      newPassword: input.newPassword,
    });

    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to update password:', error);
    return handleApiErrorForAction<MessageResponse>(error, {
      defaultMessage: 'パスワード変更に失敗しました',
    });
  }
}

/**
 * Server Action: 自分のデバイスを削除
 *
 * バックエンドでデバイスを削除し、該当デバイスの Redis セッションも削除する
 */
export async function deleteDevice(deviceId: number): Promise<ApiResponse<MessageResponse>> {
  try {
    const { ServerSessionManager } = await import('@/libs/serverSession');
    const api = createPecusApiClients();

    // まずデバイス一覧を取得して対象デバイスの publicId を確認
    const devices = await api.profile.getApiProfileDevices();
    const targetDevice = devices.find((d) => d.id === deviceId);
    const devicePublicId = targetDevice?.publicId;

    // バックエンドでデバイスを削除
    const response = await api.profile.deleteApiProfileDevices(deviceId);

    // Redis セッションも削除（publicId がある場合）
    if (devicePublicId) {
      const deletedCount = await ServerSessionManager.destroySessionsByDevicePublicId(devicePublicId);
      console.log(`[deleteDevice] Destroyed ${deletedCount} Redis sessions for device: ${devicePublicId}`);
    }

    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to delete device:', error);
    return handleApiErrorForAction<MessageResponse>(error, {
      defaultMessage: '接続端末の削除に失敗しました',
    });
  }
}

/**
 * Server Action: 他の全デバイスをログアウト
 *
 * 現在のセッションを除く、同一ユーザーの全セッションを Redis から削除し、
 * バックエンドで他のデバイスを無効化する
 */
export async function logoutOtherDevices(): Promise<
  ApiResponse<{ deletedSessionCount: number; deletedDeviceCount: number }>
> {
  try {
    const { ServerSessionManager } = await import('@/libs/serverSession');

    // 現在のセッション情報を取得
    const session = await ServerSessionManager.getSession();
    if (!session) {
      return { success: false, error: 'unauthorized', message: 'ログインが必要です' };
    }

    const api = createPecusApiClients();

    // 現在のデバイスの publicId を取得
    const currentDevicePublicId = session.device?.publicId;

    // デバイス一覧を取得して、現在のデバイス以外を削除
    const devices = await api.profile.getApiProfileDevices();
    const otherDevices = devices.filter((d) => d.publicId !== currentDevicePublicId);

    let deletedDeviceCount = 0;
    for (const device of otherDevices) {
      if (device.id) {
        try {
          await api.profile.deleteApiProfileDevices(device.id);
          deletedDeviceCount++;
        } catch (error) {
          console.error(`Failed to delete device ${device.id}:`, error);
        }
      }
    }

    // Redis から他のセッションを削除
    const deletedSessionCount = await ServerSessionManager.destroyOtherSessions(session.sessionId, session.user.id);

    console.log(`[logoutOtherDevices] Deleted ${deletedDeviceCount} devices, ${deletedSessionCount} sessions`);

    return {
      success: true,
      data: { deletedSessionCount, deletedDeviceCount },
    };
  } catch (error) {
    console.error('Failed to logout other devices:', error);
    return handleApiErrorForAction<{ deletedSessionCount: number; deletedDeviceCount: number }>(error, {
      defaultMessage: '他デバイスのログアウトに失敗しました',
    });
  }
}

/**
 * Server Action: スキルを設定（洗い替え）
 * @param input クライアント側で Zod 検証済みのデータ
 */
export async function setUserSkills(input: UpdateSkillsFormInput): Promise<ApiResponse<SuccessResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.profile.putApiProfileSkills({
      skillIds: input.skillIds ?? null,
      userRowVersion: null, // optional: 簡略化のため送信しない
    });

    return { success: true, data: response };
  } catch (error) {
    // 409 Conflict（スキル更新で rowVersion チェックする場合）
    const concurrencyError = detectConcurrencyError(error);
    if (concurrencyError) {
      return {
        success: false,
        error: 'conflict',
        message: concurrencyError.message,
      };
    }

    console.error('Failed to set skills:', error);
    return handleApiErrorForAction<SuccessResponse>(error, {
      defaultMessage: 'スキル設定に失敗しました',
    });
  }
}

/**
 * Server Action: アバターファイルをアップロード
 * @param fileData ファイル情報オブジェクト
 */
export async function uploadAvatarFile(fileData: {
  fileName: string;
  fileType: string;
  arrayBuffer: ArrayBuffer;
}): Promise<
  | {
      success: true;
      data: { fileUrl?: string; fileSize: number; contentType?: string };
    }
  | { success: false; error: string; message: string }
> {
  try {
    const api = createPecusApiClients();

    // ユーザー情報を取得してResourceIdを設定
    const userResponse = await api.profile.getApiProfile();

    // 認証済みAxiosインスタンスを作成
    // Note: OpenAPI自動生成クライアントはNode.js環境でのFormData/Fileオブジェクト処理に非対応のため、
    //       ファイルアップロードは直接Axiosを使用してFormDataを送信する
    const axios = await createAuthenticatedAxios();

    // FormDataを作成（Node.js環境でも動作するFormData）
    const FormData = (await import('form-data')).default;
    const formData = new FormData();

    // ArrayBufferをBufferに変換してFormDataに追加
    const buffer = Buffer.from(fileData.arrayBuffer);
    formData.append('FileType', 'Avatar');
    formData.append('ResourceId', userResponse.id.toString());
    formData.append('File', buffer, {
      filename: fileData.fileName,
      contentType: fileData.fileType,
    });

    // Axiosで直接POSTリクエスト
    const response = await axios.post('/api/files', formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

    return {
      success: true,
      data: {
        fileUrl: response.data.fileUrl ?? undefined,
        fileSize: response.data.fileSize ?? 0,
        contentType: response.data.contentType ?? undefined,
      },
    };
  } catch (error) {
    console.error('Failed to upload avatar file:', error);
    return handleApiErrorForAction<{ fileUrl?: string; fileSize: number; contentType?: string }>(error, {
      defaultMessage: 'アップロードに失敗しました',
    });
  }
}

/**
 * Server Action: アップロード済みアバター画像を削除
 * @param fileData ファイル情報（ファイル名、リソースID）
 */
export async function deleteAvatarFile(fileData: {
  fileName: string;
  resourceId: number;
}): Promise<ApiResponse<MessageResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.file.deleteApiDownloadsIcons('Avatar', fileData.resourceId, fileData.fileName);

    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to delete avatar file:', error);
    return handleApiErrorForAction<MessageResponse>(error, {
      defaultMessage: '削除に失敗しました',
    });
  }
}

/**
 * Server Action: ユーザー設定を更新
 * 楽観的ロックで競合を検出
 */
export async function updateUserSetting(request: {
  canReceiveEmail: boolean;
  canReceiveRealtimeNotification: boolean;
  timeZone: string;
  language: string;
  landingPage?: LandingPage;
  focusScorePriority?: FocusScorePriority;
  focusTasksLimit: number;
  waitingTasksLimit: number;
  rowVersion: number;
}): Promise<ApiResponse<UserSettingResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.profile.putApiProfileSetting({
      canReceiveEmail: request.canReceiveEmail,
      canReceiveRealtimeNotification: request.canReceiveRealtimeNotification,
      timeZone: request.timeZone,
      language: request.language,
      landingPage: request.landingPage,
      focusScorePriority: request.focusScorePriority,
      focusTasksLimit: request.focusTasksLimit,
      waitingTasksLimit: request.waitingTasksLimit,
      rowVersion: request.rowVersion,
    });
    return { success: true, data: response };
  } catch (error) {
    // 409 Conflict（並行更新）を検出
    const concurrencyError = detectConcurrencyError(error);
    if (concurrencyError) {
      const payload = concurrencyError.payload ?? {};
      const current = payload.current as UserSettingResponse | undefined;
      return {
        success: false,
        error: 'conflict',
        message: concurrencyError.message,
        latest: {
          type: 'userSetting',
          data: current as UserSettingResponse,
        },
      };
    }

    console.error('Failed to update user setting:', error);
    return handleApiErrorForAction<UserSettingResponse>(error, {
      defaultMessage: 'ユーザー設定の更新に失敗しました',
    });
  }
}

/**
 * Server Action: アプリケーション公開設定を取得
 *
 * 組織設定とユーザー設定を統合して返す。
 * SSRでレイアウトレベルで取得し、Context経由で配信することを想定。
 * APIキーやパスワード等のセンシティブ情報は含まれない。
 */
export async function fetchAppSettings(): Promise<ApiResponse<AppPublicSettingsResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.profile.getApiProfileAppSettings();
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to fetch app settings:', error);
    return handleApiErrorForAction<AppPublicSettingsResponse>(error, {
      defaultMessage: 'アプリケーション設定の取得に失敗しました',
    });
  }
}
