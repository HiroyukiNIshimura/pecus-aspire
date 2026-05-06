import { z } from 'zod';

const workspaceIdSchema = z
  .number({ error: 'ワークスペースIDが不正です。' })
  .int('ワークスペースIDが不正です。')
  .positive('ワークスペースIDが不正です。');

const itemIdSchema = z
  .number({ error: 'アイテムIDが不正です。' })
  .int('アイテムIDが不正です。')
  .positive('アイテムIDが不正です。');

const contentSchema = z.string({ error: 'メモ内容が不正です。' });

export const createPersonalItemNoteInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  itemId: itemIdSchema,
  content: contentSchema,
});

export type CreatePersonalItemNoteInput = z.infer<typeof createPersonalItemNoteInputSchema>;

export const updatePersonalItemNoteInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  itemId: itemIdSchema,
  content: contentSchema,
});

export type UpdatePersonalItemNoteInput = z.infer<typeof updatePersonalItemNoteInputSchema>;

export const deletePersonalItemNoteInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  itemId: itemIdSchema,
});

export type DeletePersonalItemNoteInput = z.infer<typeof deletePersonalItemNoteInputSchema>;
