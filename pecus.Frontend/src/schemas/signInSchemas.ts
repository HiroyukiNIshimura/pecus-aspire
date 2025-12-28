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

/**
 * パスワード設定検証スキーマ（新規ユーザー向け）
 * - トークン: 必須
 * - パスワード: 8〜100文字、大文字・小文字・数字を含む
 * - パスワード確認: パスワードと一致
 */
export const setPasswordSchema = z
  .object({
    token: z.string().min(1, 'トークンは必須です。'),
    password: z
      .string()
      .min(8, 'パスワードは8文字以上で入力してください。')
      .max(100, 'パスワードは100文字以内で入力してください。')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
        'パスワードは大文字・小文字・数字を含む8文字以上で設定してください。',
      ),
    confirmPassword: z.string().min(1, 'パスワード確認は必須です。'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'パスワードが一致しません。',
    path: ['confirmPassword'],
  });

export type SetPasswordInput = z.infer<typeof setPasswordSchema>;

/**
 * パスワードリセット実行検証スキーマ（既存ユーザー向け）
 * - トークン: 必須
 * - パスワード: 8〜100文字、大文字・小文字・数字を含む
 * - パスワード確認: パスワードと一致
 */
export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'トークンは必須です。'),
    password: z
      .string()
      .min(8, 'パスワードは8文字以上で入力してください。')
      .max(100, 'パスワードは100文字以内で入力してください。')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
        'パスワードは大文字・小文字・数字を含む8文字以上で設定してください。',
      ),
    confirmPassword: z.string().min(1, 'パスワード確認は必須です。'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'パスワードが一致しません。',
    path: ['confirmPassword'],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
