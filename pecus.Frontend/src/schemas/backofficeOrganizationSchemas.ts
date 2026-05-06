import { z } from 'zod';

const organizationIdSchema = z
  .number({ error: '組織IDが不正です。' })
  .int('組織IDが不正です。')
  .positive('組織IDが不正です。');

const botIdSchema = z
  .number({ error: 'ボットIDが不正です。' })
  .int('ボットIDが不正です。')
  .positive('ボットIDが不正です。');

const rowVersionSchema = z
  .number({ error: '行バージョンが不正です。' })
  .int('行バージョンが不正です。')
  .min(0, '行バージョンが不正です。');

export const updateBackOfficeOrganizationInputSchema = z.object({
  id: organizationIdSchema,
  request: z.object({
    representativeName: z.string().optional(),
    phoneNumber: z.string().optional(),
    email: z.string().optional(),
    isActive: z.boolean().optional(),
    rowVersion: rowVersionSchema,
  }),
});

export type UpdateBackOfficeOrganizationInput = z.infer<typeof updateBackOfficeOrganizationInputSchema>;

export const deleteBackOfficeOrganizationInputSchema = z.object({
  id: organizationIdSchema,
  confirmOrganizationCode: z
    .string({ error: '確認用組織コードは必須です。' })
    .trim()
    .min(1, '確認用組織コードは必須です。'),
  rowVersion: rowVersionSchema,
});

export type DeleteBackOfficeOrganizationInput = z.infer<typeof deleteBackOfficeOrganizationInputSchema>;

export const createBackOfficeOrganizationInputSchema = z.object({
  name: z.string({ error: '組織名は必須です。' }).trim().min(1, '組織名は必須です。'),
  phoneNumber: z.string({ error: '電話番号は必須です。' }).trim().min(1, '電話番号は必須です。'),
  code: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  representativeName: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  adminUsername: z.string({ error: '管理者ユーザー名は必須です。' }).trim().min(1, '管理者ユーザー名は必須です。'),
  adminEmail: z.string({ error: '管理者メールアドレスは必須です。' }).trim().min(1, '管理者メールアドレスは必須です。'),
});

export type CreateBackOfficeOrganizationInput = z.infer<typeof createBackOfficeOrganizationInputSchema>;

export const resendOrganizationCreatedEmailInputSchema = z.object({
  organizationId: organizationIdSchema,
});

export type ResendOrganizationCreatedEmailInput = z.infer<typeof resendOrganizationCreatedEmailInputSchema>;

export const updateBackOfficeBotPersonaInputSchema = z.object({
  organizationId: organizationIdSchema,
  botId: botIdSchema,
  request: z.object({
    persona: z.string().optional().nullable(),
    constraint: z.string().optional().nullable(),
    rowVersion: rowVersionSchema,
  }),
});

export type UpdateBackOfficeBotPersonaInput = z.infer<typeof updateBackOfficeBotPersonaInputSchema>;
