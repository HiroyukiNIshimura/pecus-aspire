import { z } from 'zod';
import type { CreateTaskCommentRequest, TaskCommentType, UpdateTaskCommentRequest } from '@/connectors/api/pecus';

const workspaceIdSchema = z
  .number({ error: 'ワークスペースIDが不正です。' })
  .int('ワークスペースIDが不正です。')
  .positive('ワークスペースIDが不正です。');

const itemIdSchema = z
  .number({ error: 'アイテムIDが不正です。' })
  .int('アイテムIDが不正です。')
  .positive('アイテムIDが不正です。');

const taskIdSchema = z
  .number({ error: 'タスクIDが不正です。' })
  .int('タスクIDが不正です。')
  .positive('タスクIDが不正です。');

const commentIdSchema = z
  .number({ error: 'コメントIDが不正です。' })
  .int('コメントIDが不正です。')
  .positive('コメントIDが不正です。');

const rowVersionSchema = z
  .number({ error: '行バージョンが不正です。' })
  .int('行バージョンが不正です。')
  .nonnegative('行バージョンが不正です。');

const pageSchema = z
  .number({ error: 'ページ番号が不正です。' })
  .int('ページ番号が不正です。')
  .positive('ページ番号が不正です。');

const taskCommentTypeSchema = z
  .custom<TaskCommentType>((value) => value === undefined || typeof value === 'string', {
    error: 'コメント種別が不正です。',
  })
  .optional();

export const getTaskCommentsInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  itemId: itemIdSchema,
  taskId: taskIdSchema,
  page: pageSchema.optional(),
  commentType: taskCommentTypeSchema,
  includeDeleted: z.boolean({ error: '削除表示フラグが不正です。' }).optional(),
});

export type GetTaskCommentsInput = z.infer<typeof getTaskCommentsInputSchema>;

export const getTaskCommentInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  itemId: itemIdSchema,
  taskId: taskIdSchema,
  commentId: commentIdSchema,
});

export type GetTaskCommentInput = z.infer<typeof getTaskCommentInputSchema>;

export const createTaskCommentInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  itemId: itemIdSchema,
  taskId: taskIdSchema,
  request: z.custom<CreateTaskCommentRequest>((value) => typeof value === 'object' && value !== null, {
    error: 'コメント作成リクエストが不正です。',
  }),
});

export type CreateTaskCommentInput = z.infer<typeof createTaskCommentInputSchema>;

export const updateTaskCommentInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  itemId: itemIdSchema,
  taskId: taskIdSchema,
  commentId: commentIdSchema,
  request: z.custom<UpdateTaskCommentRequest>((value) => typeof value === 'object' && value !== null, {
    error: 'コメント更新リクエストが不正です。',
  }),
});

export type UpdateTaskCommentInput = z.infer<typeof updateTaskCommentInputSchema>;

export const deleteTaskCommentInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  itemId: itemIdSchema,
  taskId: taskIdSchema,
  commentId: commentIdSchema,
  rowVersion: rowVersionSchema,
});

export type DeleteTaskCommentInput = z.infer<typeof deleteTaskCommentInputSchema>;
