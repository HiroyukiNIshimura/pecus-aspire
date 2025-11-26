import { z } from 'zod';

/**
 * ログイン時の認証情報検証スキーマ
 * - ログインID/メールアドレス: 1〜255文字
 * - パスワード: 1〜255文字
 */
export const loginSchema = z.object({
  loginIdentifier: z
    .string()
    .min(1, 'ログインIDまたはメールアドレスは必須です。')
    .max(255, 'ログインIDまたはメールアドレスは255文字以内で入力してください。'),
  password: z.string().min(1, 'パスワードは必須です。').max(255, 'パスワードは255文字以内で入力してください。'),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * パスワードリセットリクエスト検証スキーマ
 * - メールアドレス: 有効なメール形式で1〜255文字
 */
export const requestPasswordResetSchema = z.object({
  email: z
    .string()
    .min(1, 'メールアドレスは必須です。')
    .email('有効なメールアドレスを入力してください。')
    .max(255, 'メールアドレスは255文字以内で入力してください。'),
});

export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;
