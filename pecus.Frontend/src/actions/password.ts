'use server';

import { createPecusApiClients, parseErrorResponse } from '@/connectors/api/PecusApiClient';
import type { MessageResponse } from '@/connectors/api/pecus';
import { type RequestPasswordResetInput, requestPasswordResetSchema } from '@/schemas/signInSchemas';
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
