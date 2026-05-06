import { z } from 'zod';
import type {
  CreateWorkspaceItemRequest,
  ItemSortBy,
  MyItemRelationType,
  RelationType,
  SortOrder,
  UpdateWorkspaceItemAssigneeRequest,
  UpdateWorkspaceItemAttributeRequest,
  UpdateWorkspaceItemRequest,
  UpdateWorkspaceItemStatusRequest,
} from '@/connectors/api/pecus';

const workspaceIdSchema = z
  .number({ error: 'ワークスペースIDが不正です。' })
  .int('ワークスペースIDが不正です。')
  .positive('ワークスペースIDが不正です。');

const itemIdSchema = z
  .number({ error: 'アイテムIDが不正です。' })
  .int('アイテムIDが不正です。')
  .positive('アイテムIDが不正です。');

const relationIdSchema = z
  .number({ error: '関連IDが不正です。' })
  .int('関連IDが不正です。')
  .positive('関連IDが不正です。');

const pageSchema = z
  .number({ error: 'ページ番号が不正です。' })
  .int('ページ番号が不正です。')
  .positive('ページ番号が不正です。');

const itemCodeSchema = z.string({ error: 'アイテムコードが不正です。' }).min(1, 'アイテムコードが不正です。');

const titleSchema = z.string({ error: '件名が不正です。' }).min(1, '件名が不正です。').max(300, '件名が長すぎます。');

const workspaceItemAttributeTypeSchema = z.enum(['assignee', 'committer', 'priority', 'duedate', 'archive'], {
  error: '属性が不正です。',
});

export type WorkspaceItemAttributeType = z.infer<typeof workspaceItemAttributeTypeSchema>;

export const fetchMyItemsInputSchema = z.object({
  page: pageSchema.optional(),
  relation: z
    .custom<MyItemRelationType>((value) => value === undefined || typeof value === 'string', {
      error: '関連タイプが不正です。',
    })
    .optional(),
  includeArchived: z.boolean({ error: 'アーカイブ条件が不正です。' }).optional(),
  workspaceIds: z.array(workspaceIdSchema, { error: 'ワークスペースIDが不正です。' }).optional(),
  sortBy: z
    .custom<ItemSortBy>((value) => value === undefined || typeof value === 'string', {
      error: 'ソート項目が不正です。',
    })
    .optional(),
  order: z
    .custom<SortOrder>((value) => value === undefined || typeof value === 'string', {
      error: 'ソート順が不正です。',
    })
    .optional(),
});

export type FetchMyItemsInput = z.infer<typeof fetchMyItemsInputSchema>;

export const fetchLatestWorkspaceItemInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  itemId: itemIdSchema,
});

export type FetchLatestWorkspaceItemInput = z.infer<typeof fetchLatestWorkspaceItemInputSchema>;

export const fetchWorkspaceItemByCodeInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  itemCode: itemCodeSchema,
});

export type FetchWorkspaceItemByCodeInput = z.infer<typeof fetchWorkspaceItemByCodeInputSchema>;

export const fetchChildrenCountInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  itemId: itemIdSchema,
});

export type FetchChildrenCountInput = z.infer<typeof fetchChildrenCountInputSchema>;

export const fetchDocumentSuggestionInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  title: titleSchema,
});

export type FetchDocumentSuggestionInput = z.infer<typeof fetchDocumentSuggestionInputSchema>;

export const createWorkspaceItemInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  request: z.custom<CreateWorkspaceItemRequest>((value) => typeof value === 'object' && value !== null, {
    error: '作成リクエストが不正です。',
  }),
});

export type CreateWorkspaceItemInput = z.infer<typeof createWorkspaceItemInputSchema>;

export const updateWorkspaceItemInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  itemId: itemIdSchema,
  request: z.custom<UpdateWorkspaceItemRequest>((value) => typeof value === 'object' && value !== null, {
    error: '更新リクエストが不正です。',
  }),
});

export type UpdateWorkspaceItemInput = z.infer<typeof updateWorkspaceItemInputSchema>;

export const workspaceItemPinInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  itemId: itemIdSchema,
});

export type WorkspaceItemPinInput = z.infer<typeof workspaceItemPinInputSchema>;

export const updateWorkspaceItemAssigneeInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  itemId: itemIdSchema,
  request: z.custom<UpdateWorkspaceItemAssigneeRequest>((value) => typeof value === 'object' && value !== null, {
    error: '担当者更新リクエストが不正です。',
  }),
});

export type UpdateWorkspaceItemAssigneeInput = z.infer<typeof updateWorkspaceItemAssigneeInputSchema>;

export const updateWorkspaceItemStatusInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  itemId: itemIdSchema,
  request: z.custom<UpdateWorkspaceItemStatusRequest>((value) => typeof value === 'object' && value !== null, {
    error: 'ステータス更新リクエストが不正です。',
  }),
});

export type UpdateWorkspaceItemStatusInput = z.infer<typeof updateWorkspaceItemStatusInputSchema>;

export const updateWorkspaceItemAttributeInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  itemId: itemIdSchema,
  attribute: workspaceItemAttributeTypeSchema,
  request: z.custom<UpdateWorkspaceItemAttributeRequest>((value) => typeof value === 'object' && value !== null, {
    error: '属性更新リクエストが不正です。',
  }),
});

export type UpdateWorkspaceItemAttributeInput = z.infer<typeof updateWorkspaceItemAttributeInputSchema>;

export const addWorkspaceItemRelationsInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  itemId: itemIdSchema,
  toItemIds: z.array(itemIdSchema, { error: '関連先アイテムIDが不正です。' }),
  relationType: z
    .custom<RelationType>((value) => typeof value === 'string', {
      error: '関連タイプが不正です。',
    })
    .optional(),
});

export type AddWorkspaceItemRelationsInput = z.infer<typeof addWorkspaceItemRelationsInputSchema>;

export const removeWorkspaceItemRelationInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  itemId: itemIdSchema,
  relationId: relationIdSchema,
});

export type RemoveWorkspaceItemRelationInput = z.infer<typeof removeWorkspaceItemRelationInputSchema>;
