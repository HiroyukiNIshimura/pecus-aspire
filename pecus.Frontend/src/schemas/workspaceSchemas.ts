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
