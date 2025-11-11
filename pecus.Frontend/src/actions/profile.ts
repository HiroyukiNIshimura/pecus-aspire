"use server";

import { createPecusApiClients, detectConcurrencyError } from "@/connectors/api/PecusApiClient";
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
 * Server Action: 現在のユーザー情報を取得
 *
 * Note: Middlewareがトークンの有効性を事前に検証するため、
 * ここではenableRefreshの指定は不要（デフォルト値を使用）
 */
export async function getCurrentUser(): Promise<ApiResponse<UserInfo>> {
  try {
    const api = createPecusApiClients();
    const response = await api.profile.getApiProfile();
    return {
      success: true,
      data: {
        id: response.id,
        name: response.username,
        email: response.email,
        roles: response.roles,
        isAdmin: response.isAdmin ?? false,
      },
    };
  } catch (error: any) {
    console.error("Failed to fetch current user:", error);
    return {
      success: false,
      error: "server",
      message:
        error.body?.message || error.message || "Failed to fetch current user",
    };
  }
}

/**
 * Server Action: プロフィールを更新（ユーザー名、アバター）
 * 楽観的ロックで競合を検出
 */
export async function updateProfile(request: {
  username?: string;
  avatarType?: AvatarType;
  avatarUrl?: string;
  skillIds?: number[];
  rowVersion: number; // 楽観的ロック用（PostgreSQL xmin）
}): Promise<ApiResponse<UserResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.profile.putApiProfile({
      username: request.username,
      avatarType: request.avatarType,
      avatarUrl: request.avatarUrl,
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
    const response = await api.emailChange.postApiProfileEmailRequestChange({
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
    const response = await api.emailChange.getApiProfileEmailVerify(token);

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
 * Server Action: 未使用のメールアドレス変更トークン情報を取得
 */
export async function getPendingEmailChange(): Promise<ApiResponse<PendingEmailChangeResponse | null>> {
  try {
    const api = createPecusApiClients();
    const response = await api.emailChange.getApiProfileEmailPending();

    return { success: true, data: response };
  } catch (error: any) {
    // 204 No Content の場合は null を返す
    if (error.status === 204) {
      return { success: true, data: null };
    }

    console.error("Failed to get pending email change:", error);
    return {
      success: false,
      error: "server",
      message:
        error.body?.message || error.message || "保留中のメールアドレス変更情報の取得に失敗しました",
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
 * Server Action: ファイルアップロード
 * FormData で POST /api/files にアップロード
 */
export async function uploadAvatarFile(formData: FormData): Promise<
  ApiResponse<{
    fileUrl?: string;
    fileSize?: number;
    contentType?: string;
    uploadedAt?: string;
  }>
> {
  try {
    const api = createPecusApiClients();

    // FormData をそのまま送信
    const response = await api.fileUpload.postApiFiles(formData as any);

    return {
      success: true,
      data: {
        fileUrl: response.fileUrl ?? undefined,
        fileSize: response.fileSize,
        contentType: response.contentType ?? undefined,
        uploadedAt: response.uploadedAt,
      },
    };
  } catch (error: any) {
    console.error("Failed to upload avatar:", error);
    return {
      success: false,
      error: "server",
      message:
        error.body?.message || error.message || "Failed to upload avatar",
    };
  }
}
