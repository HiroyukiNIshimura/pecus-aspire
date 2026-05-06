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

export const joinWorkspaceInputSchema = z.object({
  workspaceId: workspaceIdSchema,
});

export type JoinWorkspaceInput = z.infer<typeof joinWorkspaceInputSchema>;
