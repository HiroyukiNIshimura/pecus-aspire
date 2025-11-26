"use server";

import { z } from "zod";
import { createPecusApiClients } from "@/connectors/api/PecusApiClient";
import { type RequestPasswordResetInput, requestPasswordResetSchema } from "@/schemas/signInSchemas";

/**
 * パスワードリセットリクエスト実行
 * メールアドレスを入力してパスワードリセットメールを送信
 *
 * @param input - パスワードリセットリクエスト入力値
 * @returns 成功時は { success: true, message: string }、失敗時はエラー情報を返す
 */
export async function requestPasswordResetAction(
  input: RequestPasswordResetInput,
): Promise<{ success: true; message: string } | { success: false; errors: string[] }> {
  try {
    // サーバーサイド検証（クライアント検証を信頼しない）
    const validatedData = await requestPasswordResetSchema.parseAsync(input);

    // API クライアント生成
    const clients = await createPecusApiClients();

    // パスワードリセットリクエスト送信
    const result = await clients.entrancePassword.postApiEntrancePasswordRequestReset({
      email: validatedData.email,
    });

    return {
      success: true,
      message: result.message || "パスワードリセットメールを送信しました。メールを確認してください。",
    };
  } catch (error) {
    // Zodバリデーションエラー
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.issues.map((issue) => issue.message),
      };
    }

    // API呼び出しエラー
    if (error instanceof Error) {
      return {
        success: false,
        errors: [error.message || "パスワードリセットリクエストに失敗しました。"],
      };
    }

    // 予期しないエラー
    return {
      success: false,
      errors: ["予期しないエラーが発生しました。"],
    };
  }
}
