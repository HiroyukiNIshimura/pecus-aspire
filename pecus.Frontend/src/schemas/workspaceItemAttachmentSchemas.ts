import { z } from 'zod';

const workspaceIdSchema = z
  .number({ error: 'ワークスペースIDが不正です。' })
  .int('ワークスペースIDが不正です。')
  .positive('ワークスペースIDが不正です。');

const itemIdSchema = z
  .number({ error: 'アイテムIDが不正です。' })
  .int('アイテムIDが不正です。')
  .positive('アイテムIDが不正です。');

const attachmentIdSchema = z
  .number({ error: '添付ファイルIDが不正です。' })
  .int('添付ファイルIDが不正です。')
  .positive('添付ファイルIDが不正です。');

const taskIdSchema = z
  .number({ error: 'タスクIDが不正です。' })
  .int('タスクIDが不正です。')
  .positive('タスクIDが不正です。');

export const uploadWorkspaceItemAttachmentInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  itemId: itemIdSchema,
  formData: z.custom<FormData>((value) => value instanceof FormData, {
    error: 'フォームデータが不正です。',
  }),
  taskId: taskIdSchema.optional(),
});

export type UploadWorkspaceItemAttachmentInput = z.infer<typeof uploadWorkspaceItemAttachmentInputSchema>;

export const deleteWorkspaceItemAttachmentInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  itemId: itemIdSchema,
  attachmentId: attachmentIdSchema,
});

export type DeleteWorkspaceItemAttachmentInput = z.infer<typeof deleteWorkspaceItemAttachmentInputSchema>;
