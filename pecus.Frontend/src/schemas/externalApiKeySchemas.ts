import { z } from 'zod';

export const createExternalApiKeyInputSchema = z.object({
  name: z
    .string({ error: 'キー名は必須です。' })
    .trim()
    .min(1, 'キー名は必須です。')
    .max(100, 'キー名は100文字以内で入力してください。'),
  expirationDays: z
    .number({ error: '有効期限（日数）は必須です。' })
    .int('有効期限（日数）は整数で入力してください。')
    .min(1, '有効期限（日数）は1以上で入力してください。')
    .max(730, '有効期限（日数）は730以下で入力してください。')
    .optional(),
});

export type CreateExternalApiKeyInput = z.infer<typeof createExternalApiKeyInputSchema>;

export const revokeExternalApiKeyInputSchema = z.object({
  keyId: z.number().int().positive('APIキーIDが不正です。'),
});

export type RevokeExternalApiKeyInput = z.infer<typeof revokeExternalApiKeyInputSchema>;
