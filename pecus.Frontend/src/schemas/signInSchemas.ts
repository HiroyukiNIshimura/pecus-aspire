import { z } from "zod";

/**
 * ログイン時の認証情報検証スキーマ
 * - ログインID/メールアドレス: 1〜255文字
 * - パスワード: 1〜255文字
 */
export const loginSchema = z.object({
  loginIdentifier: z
    .string()
    .min(1, "ログインIDまたはメールアドレスは必須です。")
    .max(255, "ログインIDまたはメールアドレスは255文字以内で入力してください。"),
  password: z
    .string()
    .min(1, "パスワードは必須です。")
    .max(255, "パスワードは255文字以内で入力してください。"),
});

export type LoginInput = z.infer<typeof loginSchema>;
