'use server';

import { createPecusApiClients, parseErrorResponse } from '@/connectors/api/PecusApiClient';
import type { MessageResponse } from '@/connectors/api/pecus';
import {
  type RequestPasswordResetInput,
  requestPasswordResetSchema,
  type SetPasswordInput,
  setPasswordSchema,
} from '@/schemas/signInSchemas';
import type { ApiResponse } from './types';
import { validationError } from './types';

/**
 * パスワードリセットリクエスト実行
 * メールアドレスを入力してパスワードリセットメールを送信
 *
 * @param input - パスワードリセットリクエスト入力値
 * @returns ApiResponse<MessageResponse> 形式の統一レスポンス
 */
export async function requestPasswordResetAction(
  input: RequestPasswordResetInput,
): Promise<ApiResponse<MessageResponse>> {
  try {
    // サーバーサイド検証（クライアント検証を信頼しない）
    const parseResult = await requestPasswordResetSchema.safeParseAsync(input);
    if (!parseResult.success) {
      const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
      return validationError(errorMessages);
    }

    // API クライアント生成
    const clients = await createPecusApiClients();

    // パスワードリセットリクエスト送信
    const result = await clients.entrancePassword.postApiEntrancePasswordRequestReset({
      email: parseResult.data.email,
    });

    return {
      success: true,
      data: {
        message: result.message || 'パスワードリセットメールを送信しました。メールを確認してください。',
      },
    };
  } catch (error) {
    console.error('Failed to request password reset:', error);
    return parseErrorResponse(error, 'パスワードリセットリクエストに失敗しました。');
  }
}

/**
 * パスワード設定実行（新規ユーザー向け）
 * トークンを使って初期パスワードを設定
 *
 * @param input - パスワード設定入力値
 * @returns ApiResponse<MessageResponse> 形式の統一レスポンス
 */
export async function setPasswordAction(input: SetPasswordInput): Promise<ApiResponse<MessageResponse>> {
  try {
    // サーバーサイド検証
    const parseResult = await setPasswordSchema.safeParseAsync(input);
    if (!parseResult.success) {
      const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
      return validationError(errorMessages);
    }

    // API クライアント生成（認証不要なので公開エンドポイント）
    const clients = await createPecusApiClients();

    // パスワード設定 API 呼び出し
    const result = await clients.entrancePassword.postApiEntrancePasswordSet({
      token: parseResult.data.token,
      password: parseResult.data.password,
    });

    return {
      success: true,
      data: {
        message: result.message || 'パスワードが設定されました。ログインしてください。',
      },
    };
  } catch (error) {
    console.error('Failed to set password:', error);
    return parseErrorResponse(error, 'パスワード設定に失敗しました。トークンが無効または期限切れの可能性があります。');
  }
}
