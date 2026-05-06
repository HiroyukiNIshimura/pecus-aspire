import { z } from 'zod';

const workspaceIdSchema = z
  .number({ error: 'ワークスペースIDが不正です。' })
  .int('ワークスペースIDが不正です。')
  .positive('ワークスペースIDが不正です。');

const userIdSchema = z
  .number({ error: 'ユーザーIDが不正です。' })
  .int('ユーザーIDが不正です。')
  .positive('ユーザーIDが不正です。');

const rowVersionSchema = z
  .number({ error: '行バージョンが不正です。' })
  .int('行バージョンが不正です。')
  .min(0, '行バージョンが不正です。');

const workspaceRoleSchema = z.enum(['Owner', 'Member', 'Viewer'], {
  error: 'ワークスペースロールが不正です。',
});

export const createWorkspaceInputSchema = z.object({
  organizationId: z.number({ error: '組織IDが不正です。' }).int('組織IDが不正です。').positive('組織IDが不正です。'),
  name: z
    .string({ error: 'ワークスペース名は必須です。' })
    .trim()
    .min(1, 'ワークスペース名は必須です。')
    .max(100, 'ワークスペース名は100文字以内で入力してください。'),
  description: z.string().max(500, '説明は500文字以内で入力してください。').optional(),
  genreId: z
    .number({ error: 'ジャンルIDが不正です。' })
    .int('ジャンルIDが不正です。')
    .positive('ジャンルIDが不正です。'),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceInputSchema>;

export const updateWorkspaceInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  request: z.object({
    name: z
      .string({ error: 'ワークスペース名は必須です。' })
      .trim()
      .min(1, 'ワークスペース名は必須です。')
      .max(100, 'ワークスペース名は100文字以内で入力してください。'),
    description: z.string().max(500, '説明は500文字以内で入力してください。').optional(),
    genreId: z
      .number({ error: 'ジャンルIDが不正です。' })
      .int('ジャンルIDが不正です。')
      .positive('ジャンルIDが不正です。'),
    rowVersion: rowVersionSchema,
  }),
});

export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceInputSchema>;

export const deleteWorkspaceInputSchema = z.object({
  workspaceId: workspaceIdSchema,
});

export type DeleteWorkspaceInput = z.infer<typeof deleteWorkspaceInputSchema>;

export const activateWorkspaceInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  rowVersion: rowVersionSchema,
});

export type ActivateWorkspaceInput = z.infer<typeof activateWorkspaceInputSchema>;

export const deactivateWorkspaceInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  rowVersion: rowVersionSchema,
});

export type DeactivateWorkspaceInput = z.infer<typeof deactivateWorkspaceInputSchema>;

export const removeWorkspaceMemberInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  userId: userIdSchema,
});

export type RemoveWorkspaceMemberInput = z.infer<typeof removeWorkspaceMemberInputSchema>;

export const updateWorkspaceMemberRoleInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  userId: userIdSchema,
  workspaceRole: workspaceRoleSchema,
});

export type UpdateWorkspaceMemberRoleInput = z.infer<typeof updateWorkspaceMemberRoleInputSchema>;

export const addWorkspaceMemberInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  userId: userIdSchema,
  workspaceRole: workspaceRoleSchema,
});

export type AddWorkspaceMemberInput = z.infer<typeof addWorkspaceMemberInputSchema>;

const genreIdSchema = z
  .number({ error: 'ジャンルIDが不正です。' })
  .int('ジャンルIDが不正です。')
  .positive('ジャンルIDが不正です。');

export const getAdminWorkspacesInputSchema = z.object({
  page: z
    .number({ error: 'ページ番号が不正です。' })
    .int('ページ番号が不正です。')
    .positive('ページ番号が不正です。')
    .optional()
    .default(1),
  isActive: z.boolean().optional(),
  genreId: genreIdSchema.optional(),
});

export type GetAdminWorkspacesInput = z.input<typeof getAdminWorkspacesInputSchema>;

export const getAdminWorkspaceDetailInputSchema = z.object({
  workspaceId: workspaceIdSchema,
});

export type GetAdminWorkspaceDetailInput = z.infer<typeof getAdminWorkspaceDetailInputSchema>;
