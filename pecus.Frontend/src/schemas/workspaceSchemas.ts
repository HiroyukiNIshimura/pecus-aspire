import { z } from 'zod';
import { workspaceDescriptionSchema, workspaceGenreIdSchema, workspaceNameSchema } from './atoms/workspace';

/**
 * ワークスペース作成スキーマ
 */
const workspaceBaseSchema = {
  name: workspaceNameSchema,
  description: workspaceDescriptionSchema,
  genreId: workspaceGenreIdSchema,
};

export const createWorkspaceSchema = z.object(workspaceBaseSchema);

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;

/**
 * ワークスペース更新スキーマ
 */
export const updateWorkspaceSchema = z.object(workspaceBaseSchema);

export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;

/**
 * ワークスペース削除スキーマ
 */
export const deleteWorkspaceInputSchema = z.object({
  workspaceId: z
    .number({ error: 'ワークスペースIDが不正です。' })
    .int('ワークスペースIDが不正です。')
    .positive('ワークスペースIDが不正です。'),
});

export type DeleteWorkspaceInput = z.infer<typeof deleteWorkspaceInputSchema>;

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
  .nonnegative('行バージョンが不正です。');

const workspaceRoleSchema = z.enum(['Viewer', 'Member', 'Owner'], { error: 'ロールが不正です。' }).nullable();

const workspaceModeSchema = z.enum(['Unknown', 'Normal', 'Document'], {
  error: 'ワークスペースモードが不正です。',
});

export const createWorkspaceActionInputSchema = z.object({
  name: workspaceNameSchema,
  code: z.string().max(50, 'コードは50文字以内で入力してください。').optional(),
  description: workspaceDescriptionSchema,
  genreId: workspaceGenreIdSchema,
  mode: workspaceModeSchema.nullable().optional(),
});

export type CreateWorkspaceActionInput = z.infer<typeof createWorkspaceActionInputSchema>;

export const updateWorkspaceActionInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  name: workspaceNameSchema,
  description: workspaceDescriptionSchema,
  genreId: workspaceGenreIdSchema,
  rowVersion: rowVersionSchema,
});

export type UpdateWorkspaceActionInput = z.infer<typeof updateWorkspaceActionInputSchema>;

export const toggleWorkspaceActiveInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  isActive: z.boolean({ error: '状態が不正です。' }),
});

export type ToggleWorkspaceActiveInput = z.infer<typeof toggleWorkspaceActiveInputSchema>;

export const addMemberToWorkspaceInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  userId: userIdSchema,
  workspaceRole: workspaceRoleSchema,
});

export type AddMemberToWorkspaceInput = z.infer<typeof addMemberToWorkspaceInputSchema>;

export const removeMemberFromWorkspaceInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  userId: userIdSchema,
});

export type RemoveMemberFromWorkspaceInput = z.infer<typeof removeMemberFromWorkspaceInputSchema>;

export const updateMemberRoleInWorkspaceInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  userId: userIdSchema,
  newRole: workspaceRoleSchema,
});

export type UpdateMemberRoleInWorkspaceInput = z.infer<typeof updateMemberRoleInWorkspaceInputSchema>;

export const setWorkspaceSkillsInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  skillIds: z.array(z.number().int().positive(), { error: 'スキルIDが不正です。' }),
  rowVersion: rowVersionSchema,
});

export type SetWorkspaceSkillsInput = z.infer<typeof setWorkspaceSkillsInputSchema>;

export const searchWorkspaceMembersInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  query: z.string({ error: '検索クエリが不正です。' }).min(2, '2文字以上入力してください'),
  excludeViewer: z.boolean({ error: '除外設定が不正です。' }).optional(),
  limit: z
    .number({ error: '件数が不正です。' })
    .int('件数が不正です。')
    .min(1, '件数が不正です。')
    .max(50, '件数が不正です。')
    .optional(),
});

export type SearchWorkspaceMembersInput = z.infer<typeof searchWorkspaceMembersInputSchema>;

export const getWorkspaceTaskTrendInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  weeks: z
    .number({ error: '週数が不正です。' })
    .int('週数が不正です。')
    .min(4, '週数は4〜12の範囲で指定してください。')
    .max(12, '週数は4〜12の範囲で指定してください。')
    .optional(),
});

export type GetWorkspaceTaskTrendInput = z.infer<typeof getWorkspaceTaskTrendInputSchema>;

export const joinWorkspaceInputSchema = z.object({
  workspaceId: workspaceIdSchema,
});

export type JoinWorkspaceInput = z.infer<typeof joinWorkspaceInputSchema>;

export const getMyWorkspacesPagedInputSchema = z.object({
  page: z
    .number({ error: 'ページ番号が不正です。' })
    .int('ページ番号が不正です。')
    .positive('ページ番号が不正です。')
    .optional(),
});

export type GetMyWorkspacesPagedInput = z.infer<typeof getMyWorkspacesPagedInputSchema>;

export const getMyWorkspacesInputSchema = z.object({
  mode: workspaceModeSchema.optional(),
});

export type GetMyWorkspacesInput = z.infer<typeof getMyWorkspacesInputSchema>;

export const getWorkspaceDetailInputSchema = z.object({
  workspaceId: workspaceIdSchema,
});

export type GetWorkspaceDetailInput = z.infer<typeof getWorkspaceDetailInputSchema>;

export const fetchWorkspacesInputSchema = z.object({
  page: z
    .number({ error: 'ページ番号が不正です。' })
    .int('ページ番号が不正です。')
    .positive('ページ番号が不正です。')
    .optional(),
  genreId: z
    .number({ error: 'ジャンルIDが不正です。' })
    .int('ジャンルIDが不正です。')
    .positive('ジャンルIDが不正です。')
    .optional(),
  name: z.string({ error: 'ワークスペース名が不正です。' }).max(100, 'ワークスペース名が長すぎます。').optional(),
});

export type FetchWorkspacesInput = z.infer<typeof fetchWorkspacesInputSchema>;
