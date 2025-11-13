"use server";

import { createPecusApiClients, createAuthenticatedAxios, detectConcurrencyError } from "@/connectors/api/PecusApiClient";
import type {
  AvatarType,
  UserResponse,
  MessageResponse,
  SuccessResponse,
  EmailChangeRequestResponse,
  EmailChangeVerifyResponse,
  PendingEmailChangeResponse
} from "@/connectors/api/pecus";
import type { UserInfo } from "@/types/userInfo";
import type { ApiResponse } from "./types";
import type {
  UpdateEmailFormInput,
  UpdatePasswordFormInput,
  UpdateProfileFormInput,
  UpdateSkillsFormInput,
} from "@/schemas/profileSchemas";

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
}): Promise<ApiResponse<UserResponse>> {
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
  } catch (error: any) {
    // 409 Conflict（並行更新）を検出
    const concurrencyError = detectConcurrencyError(error);
    if (concurrencyError) {
      const payload = concurrencyError.payload ?? {};
      const current = payload.current as UserResponse | undefined;
      return {
        success: false,
        error: "conflict",
        message: concurrencyError.message,
        latest: {
          type: "user",
          data: current as UserResponse,
        },
      };
    }

    console.error("Failed to update profile:", error);
    console.error("Error body:", error.body);
    console.error("Request that failed:", request);
    return {
      success: false,
      error: "server",
      message:
        error.body?.message || error.message || "Failed to update profile",
    };
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
    const response = await api.profileEmail.postApiProfileEmailRequestChange({
      newEmail: input.newEmail,
      currentPassword: input.currentPassword,
    });

    return { success: true, data: response };
  } catch (error: any) {
    console.error("Failed to request email change:", error);
    return {
      success: false,
      error: "server",
      message:
        error.body?.message || error.message || "メールアドレス変更リクエストに失敗しました",
    };
  }
}

/**
 * Server Action: メールアドレス変更を確認（トークン検証）
 * @param token 確認トークン
 */
export async function verifyEmailChange(
  token: string,
): Promise<ApiResponse<EmailChangeVerifyResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.profileEmail.getApiProfileEmailVerify(token);

    return { success: true, data: response };
  } catch (error: any) {
    console.error("Failed to verify email change:", error);
    return {
      success: false,
      error: "server",
      message:
        error.body?.message || error.message || "メールアドレス変更の確認に失敗しました",
    };
  }
}

/**
 * Server Action: パスワードを変更
 * @param input クライアント側で Zod 検証済みのデータ
 */
export async function updateUserPassword(
  input: UpdatePasswordFormInput,
): Promise<ApiResponse<MessageResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.profile.patchApiProfilePassword({
      currentPassword: input.currentPassword,
      newPassword: input.newPassword,
    });

    return { success: true, data: response };
  } catch (error: any) {
    console.error("Failed to update password:", error);
    return {
      success: false,
      error: "server",
      message:
        error.body?.message || error.message || "パスワード変更に失敗しました",
    };
  }
}

/**
 * Server Action: スキルを設定（洗い替え）
 * @param input クライアント側で Zod 検証済みのデータ
 */
export async function setUserSkills(
  input: UpdateSkillsFormInput,
): Promise<ApiResponse<SuccessResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.profile.putApiProfileSkills({
      skillIds: input.skillIds ?? null,
      userRowVersion: null, // optional: 簡略化のため送信しない
    });

    return { success: true, data: response };
  } catch (error: any) {
    // 409 Conflict（スキル更新で rowVersion チェックする場合）
    const concurrencyError = detectConcurrencyError(error);
    if (concurrencyError) {
      return {
        success: false,
        error: "conflict",
        message: concurrencyError.message,
      };
    }

    console.error("Failed to set skills:", error);
    return {
      success: false,
      error: "server",
      message: error.body?.message || error.message || "スキル設定に失敗しました",
    };
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
  | { success: true; data: { fileUrl?: string; fileSize: number; contentType?: string } }
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
  } catch (error: any) {
    console.error("Failed to upload avatar file:", error);
    return {
      success: false,
      error: "server",
      message:
        error.response?.data?.message ||
        error.message ||
        "アップロードに失敗しました",
    };
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
    const response = await api.file.deleteApiDownloadsIcons(
      'Avatar',
      fileData.resourceId,
      fileData.fileName
    );

    return { success: true, data: response };
  } catch (error: any) {
    console.error("Failed to delete avatar file:", error);
    return {
      success: false,
      error: "server",
      message:
        error.body?.message || error.message || "削除に失敗しました",
    };
  }
}
