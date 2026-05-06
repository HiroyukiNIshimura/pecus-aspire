import { z } from 'zod';

const skillIdSchema = z
  .number({ error: 'スキルIDが不正です。' })
  .int('スキルIDが不正です。')
  .positive('スキルIDが不正です。');
const rowVersionSchema = z
  .number({ error: '行バージョンが不正です。' })
  .int('行バージョンが不正です。')
  .min(0, '行バージョンが不正です。');

export const createSkillInputSchema = z.object({
  name: z
    .string({ error: 'スキル名は必須です。' })
    .trim()
    .min(1, 'スキル名は必須です。')
    .max(100, 'スキル名は100文字以内で入力してください。'),
  description: z.string().max(500, '説明は500文字以内で入力してください。').optional(),
});

export type CreateSkillInput = z.infer<typeof createSkillInputSchema>;

export const updateSkillInputSchema = z.object({
  id: skillIdSchema,
  name: z
    .string({ error: 'スキル名は必須です。' })
    .trim()
    .min(1, 'スキル名は必須です。')
    .max(100, 'スキル名は100文字以内で入力してください。'),
  description: z.string().max(500, '説明は500文字以内で入力してください。').optional(),
  isActive: z.boolean().optional(),
  rowVersion: rowVersionSchema,
});

export type UpdateSkillInput = z.infer<typeof updateSkillInputSchema>;

export const deleteSkillInputSchema = z.object({
  id: skillIdSchema,
});

export type DeleteSkillInput = z.infer<typeof deleteSkillInputSchema>;

export const activateSkillInputSchema = z.object({
  id: skillIdSchema,
});

export type ActivateSkillInput = z.infer<typeof activateSkillInputSchema>;

export const deactivateSkillInputSchema = z.object({
  id: skillIdSchema,
});

export type DeactivateSkillInput = z.infer<typeof deactivateSkillInputSchema>;

export const getSkillsInputSchema = z.object({
  page: z
    .number({ error: 'ページ番号が不正です。' })
    .int('ページ番号が不正です。')
    .positive('ページ番号が不正です。')
    .optional()
    .default(1),
  isActive: z.boolean().optional().default(true),
});

export type GetSkillsInput = z.input<typeof getSkillsInputSchema>;

export const getAllSkillsInputSchema = z.object({
  isActive: z.boolean().optional().default(true),
});

export type GetAllSkillsInput = z.input<typeof getAllSkillsInputSchema>;

export const getSkillDetailInputSchema = z.object({
  id: skillIdSchema,
});

export type GetSkillDetailInput = z.infer<typeof getSkillDetailInputSchema>;
