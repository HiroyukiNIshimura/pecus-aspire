import { z } from 'zod';

const tagIdSchema = z.number({ error: 'タグIDが不正です。' }).int('タグIDが不正です。').positive('タグIDが不正です。');
const rowVersionSchema = z
  .number({ error: '行バージョンが不正です。' })
  .int('行バージョンが不正です。')
  .min(0, '行バージョンが不正です。');

export const createTagInputSchema = z.object({
  name: z
    .string({ error: 'タグ名は必須です。' })
    .trim()
    .min(1, 'タグ名は必須です。')
    .max(100, 'タグ名は100文字以内で入力してください。'),
  description: z.string().max(500, '説明は500文字以内で入力してください。').optional(),
});

export type CreateTagInput = z.infer<typeof createTagInputSchema>;

export const updateTagInputSchema = z.object({
  id: tagIdSchema,
  name: z
    .string({ error: 'タグ名は必須です。' })
    .trim()
    .min(1, 'タグ名は必須です。')
    .max(100, 'タグ名は100文字以内で入力してください。'),
  isActive: z.boolean().optional(),
  rowVersion: rowVersionSchema,
});

export type UpdateTagInput = z.infer<typeof updateTagInputSchema>;

export const deleteTagInputSchema = z.object({
  id: tagIdSchema,
});

export type DeleteTagInput = z.infer<typeof deleteTagInputSchema>;

export const activateTagInputSchema = z.object({
  id: tagIdSchema,
});

export type ActivateTagInput = z.infer<typeof activateTagInputSchema>;

export const deactivateTagInputSchema = z.object({
  id: tagIdSchema,
});

export type DeactivateTagInput = z.infer<typeof deactivateTagInputSchema>;

export const getTagsInputSchema = z.object({
  page: z
    .number({ error: 'ページ番号が不正です。' })
    .int('ページ番号が不正です。')
    .positive('ページ番号が不正です。')
    .optional()
    .default(1),
  isActive: z.boolean().optional().default(true),
});

export type GetTagsInput = z.input<typeof getTagsInputSchema>;

export const getTagDetailInputSchema = z.object({
  id: tagIdSchema,
});

export type GetTagDetailInput = z.infer<typeof getTagDetailInputSchema>;
