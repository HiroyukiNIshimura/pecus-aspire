import { z } from 'zod';
import { organizationSettingSchemaWithRules } from './organizationSettingSchemas';

const rowVersionSchema = z.number().int().min(0, '行バージョンが不正です。');

export const updateOrganizationInputSchema = z.object({
  name: z.string().min(1, '組織名は必須です。').max(100, '組織名は100文字以内で入力してください。').optional(),
  code: z.string().max(50, '組織コードは50文字以内で入力してください。').optional(),
  description: z.string().max(500, '説明は500文字以内で入力してください。').optional(),
  representativeName: z.string().max(100, '代表者名は100文字以内で入力してください。').optional(),
  phoneNumber: z.string().max(20, '電話番号は20文字以内で入力してください。').optional(),
  email: z
    .string()
    .email('有効なメールアドレスを入力してください。')
    .max(255, 'メールアドレスは255文字以内で入力してください。')
    .optional(),
  isActive: z.boolean().optional(),
  rowVersion: rowVersionSchema,
});

export type UpdateOrganizationInput = z.infer<typeof updateOrganizationInputSchema>;

export const updateOrganizationSettingInputSchema = organizationSettingSchemaWithRules.extend({
  rowVersion: rowVersionSchema,
});

export type UpdateOrganizationSettingInput = z.infer<typeof updateOrganizationSettingInputSchema>;

export const getAvailableModelsInputSchema = z.object({
  vendor: z.enum(['None', 'OpenAi', 'Anthropic', 'GoogleGemini', 'DeepSeek', 'Kimi'], {
    error: 'ベンダーが不正です。',
  }),
  apiKey: z.string({ error: 'APIキーは必須です。' }).min(1, 'APIキーは必須です。'),
});

export type GetAvailableModelsInput = z.infer<typeof getAvailableModelsInputSchema>;
