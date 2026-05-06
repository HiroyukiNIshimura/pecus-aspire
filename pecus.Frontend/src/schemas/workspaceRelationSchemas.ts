import { z } from 'zod';
import type { UpdateItemParentRequest, UpdateSiblingOrderRequest } from '@/connectors/api/pecus';

const workspaceIdSchema = z
  .number({ error: 'ワークスペースIDが不正です。' })
  .int('ワークスペースIDが不正です。')
  .positive('ワークスペースIDが不正です。');

export const updateItemParentInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  request: z.custom<UpdateItemParentRequest>((value) => typeof value === 'object' && value !== null, {
    error: '親更新リクエストが不正です。',
  }),
});

export type UpdateItemParentInput = z.infer<typeof updateItemParentInputSchema>;

export const updateSiblingOrderInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  request: z.custom<UpdateSiblingOrderRequest>((value) => typeof value === 'object' && value !== null, {
    error: '並び順更新リクエストが不正です。',
  }),
});

export type UpdateSiblingOrderInput = z.infer<typeof updateSiblingOrderInputSchema>;
