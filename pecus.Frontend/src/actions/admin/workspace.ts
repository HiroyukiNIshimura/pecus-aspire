'use server';

import {
  activateAdminWorkspaceWithHeyApi,
  addAdminWorkspaceMemberWithHeyApi,
  createAdminWorkspaceWithHeyApi,
  deactivateAdminWorkspaceWithHeyApi,
  deleteAdminWorkspaceWithHeyApi,
  getAdminWorkspaceByIdWithHeyApi,
  getAdminWorkspacesWithHeyApi,
  removeAdminWorkspaceMemberWithHeyApi,
  updateAdminWorkspaceMemberRoleWithHeyApi,
  updateAdminWorkspaceWithHeyApi,
} from '@/connectors/HeyApiClient';
import type {
  GetApiAdminWorkspacesByIdResponse,
  GetApiAdminWorkspacesResponse,
  SuccessResponse,
  WorkspaceDetailResponse,
  WorkspaceUserDetailResponse,
} from '@/connectors/hey-api-axios/types.gen';
import {
  detectConcurrencyError,
  detectMemberHasAssignmentsError,
} from '@/connectors/legacy-api/PecusApiClient';
import {
  type ActivateWorkspaceInput,
  type AddWorkspaceMemberInput,
  activateWorkspaceInputSchema,
  addWorkspaceMemberInputSchema,
  type CreateWorkspaceInput,
  createWorkspaceInputSchema,
  type DeactivateWorkspaceInput,
  type DeleteWorkspaceInput,
  deactivateWorkspaceInputSchema,
  deleteWorkspaceInputSchema,
  type GetAdminWorkspaceDetailInput,
  type GetAdminWorkspacesInput,
  getAdminWorkspaceDetailInputSchema,
  getAdminWorkspacesInputSchema,
  type RemoveWorkspaceMemberInput,
  removeWorkspaceMemberInputSchema,
  type UpdateWorkspaceInput,
  type UpdateWorkspaceMemberRoleInput,
  updateWorkspaceInputSchema,
  updateWorkspaceMemberRoleInputSchema,
} from '@/schemas/adminWorkspaceSchemas';
import { handleApiErrorForAction } from '../apiErrorPolicy';
import type { ApiResponse } from '../types';
import { validationError } from '../types';

/**
 * Server Action: ワークスペース一覧を取得
 */
export async function getWorkspaces(
  input: GetAdminWorkspacesInput = {},
): Promise<ApiResponse<GetApiAdminWorkspacesResponse>> {
  const parseResult = getAdminWorkspacesInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }
  try {
    const response = await getAdminWorkspacesWithHeyApi(
      parseResult.data.page,
      parseResult.data.isActive,
      parseResult.data.genreId,
    );
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to fetch workspaces:', error);
    return handleApiErrorForAction(error, { defaultMessage: 'ワークスペース一覧の取得に失敗しました' });
  }
}

/**
 * Server Action: ワークスペース詳細を取得
 */
export async function getWorkspaceDetail(
  input: GetAdminWorkspaceDetailInput,
): Promise<ApiResponse<GetApiAdminWorkspacesByIdResponse>> {
  const parseResult = getAdminWorkspaceDetailInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }
  try {
    const response = await getAdminWorkspaceByIdWithHeyApi(parseResult.data.workspaceId);
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to fetch workspace detail:', error);
    return handleApiErrorForAction(error, { defaultMessage: 'ワークスペース詳細の取得に失敗しました' });
  }
}

/**
 * Server Action: ワークスペースを作成
 */
export async function createWorkspace(input: CreateWorkspaceInput): Promise<ApiResponse<WorkspaceDetailResponse>> {
  const parseResult = createWorkspaceInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const response = await createAdminWorkspaceWithHeyApi(parseResult.data);
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to create workspace:', error);
    return handleApiErrorForAction(error, { defaultMessage: 'ワークスペースの作成に失敗しました' });
  }
}

/**
 * Server Action: ワークスペースを更新
 * @note 409 Conflict: 並行更新による競合。最新データを返す
 */
export async function updateWorkspace(input: UpdateWorkspaceInput): Promise<ApiResponse<WorkspaceDetailResponse>> {
  const parseResult = updateWorkspaceInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const response = await updateAdminWorkspaceWithHeyApi(parseResult.data.workspaceId, parseResult.data.request);
    return { success: true, data: response };
  } catch (error) {
    // 409 Conflict: 並行更新による競合を検出
    const concurrencyError = detectConcurrencyError(error);
    if (concurrencyError) {
      const payload = concurrencyError.payload ?? {};
      const current = payload.current as WorkspaceDetailResponse | undefined;
      return {
        success: false,
        error: 'conflict',
        message: concurrencyError.message,
        latest: current
          ? {
              type: 'workspace',
              data: current,
            }
          : undefined,
      };
    }

    console.error('Failed to update workspace:', error);
    return handleApiErrorForAction(error, { defaultMessage: 'ワークスペースの更新に失敗しました' });
  }
}

/**
 * Server Action: ワークスペースを削除
 */
export async function deleteWorkspace(input: DeleteWorkspaceInput): Promise<ApiResponse<SuccessResponse>> {
  const parseResult = deleteWorkspaceInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const response = await deleteAdminWorkspaceWithHeyApi(parseResult.data.workspaceId);
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to delete workspace:', error);
    return handleApiErrorForAction(error, { defaultMessage: 'ワークスペースの削除に失敗しました' });
  }
}

/**
 * Server Action: ワークスペースを有効化
 * @note 409 Conflict: 並行更新による競合。最新データを返す
 */
export async function activateWorkspace(input: ActivateWorkspaceInput): Promise<ApiResponse<SuccessResponse>> {
  const parseResult = activateWorkspaceInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const response = await activateAdminWorkspaceWithHeyApi(parseResult.data.workspaceId, parseResult.data.rowVersion);
    return { success: true, data: response };
  } catch (error) {
    // 409 Conflict: 並行更新による競合を検出
    const concurrencyError = detectConcurrencyError(error);
    if (concurrencyError) {
      const payload = concurrencyError.payload ?? {};
      const current = payload.current as WorkspaceDetailResponse | undefined;
      return {
        success: false,
        error: 'conflict',
        message: concurrencyError.message,
        latest: current
          ? {
              type: 'workspace',
              data: current,
            }
          : undefined,
      };
    }

    console.error('Failed to activate workspace:', error);
    return handleApiErrorForAction(error, { defaultMessage: 'ワークスペースの有効化に失敗しました' });
  }
}

/**
 * Server Action: ワークスペースを無効化
 * @note 409 Conflict: 並行更新による競合。最新データを返す
 */
export async function deactivateWorkspace(input: DeactivateWorkspaceInput): Promise<ApiResponse<SuccessResponse>> {
  const parseResult = deactivateWorkspaceInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const response = await deactivateAdminWorkspaceWithHeyApi(
      parseResult.data.workspaceId,
      parseResult.data.rowVersion,
    );
    return { success: true, data: response };
  } catch (error) {
    // 409 Conflict: 並行更新による競合を検出
    const concurrencyError = detectConcurrencyError(error);
    if (concurrencyError) {
      const payload = concurrencyError.payload ?? {};
      const current = payload.current as WorkspaceDetailResponse | undefined;
      return {
        success: false,
        error: 'conflict',
        message: concurrencyError.message,
        latest: current
          ? {
              type: 'workspace',
              data: current,
            }
          : undefined,
      };
    }

    console.error('Failed to deactivate workspace:', error);
    return handleApiErrorForAction(error, { defaultMessage: 'ワークスペースの無効化に失敗しました' });
  }
}

/**
 * Server Action: ワークスペースからメンバーを削除
 */
export async function removeWorkspaceMember(input: RemoveWorkspaceMemberInput): Promise<ApiResponse<SuccessResponse>> {
  const parseResult = removeWorkspaceMemberInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const response = await removeAdminWorkspaceMemberWithHeyApi(parseResult.data.workspaceId, parseResult.data.userId);
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to remove workspace member:', error);
    return handleApiErrorForAction(error, { defaultMessage: 'メンバーの削除に失敗しました' });
  }
}

/**
 * Server Action: ワークスペースメンバーのロールを変更
 */
export async function updateWorkspaceMemberRole(
  input: UpdateWorkspaceMemberRoleInput,
): Promise<ApiResponse<WorkspaceUserDetailResponse>> {
  const parseResult = updateWorkspaceMemberRoleInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const response = await updateAdminWorkspaceMemberRoleWithHeyApi(
      parseResult.data.workspaceId,
      parseResult.data.userId,
      {
        workspaceRole: parseResult.data.workspaceRole,
      },
    );
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to update workspace member role:', error);

    // Viewerへの変更時にアサインメントがある場合（409 Conflict）
    const assignmentsError = detectMemberHasAssignmentsError(error);
    if (assignmentsError) {
      return {
        success: false,
        error: 'member_has_assignments',
        message: 'このメンバーには担当中のタスク/アイテムがあります。担当を外してからViewerに変更してください。',
        assignments: assignmentsError,
      };
    }

    return handleApiErrorForAction(error, { defaultMessage: 'ロールの変更に失敗しました' });
  }
}

/**
 * Server Action: ワークスペースにメンバーを追加
 */
export async function addWorkspaceMember(
  input: AddWorkspaceMemberInput,
): Promise<ApiResponse<WorkspaceUserDetailResponse>> {
  const parseResult = addWorkspaceMemberInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const response = await addAdminWorkspaceMemberWithHeyApi(parseResult.data.workspaceId, {
      userId: parseResult.data.userId,
      workspaceRole: parseResult.data.workspaceRole,
    });
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to add workspace member:', error);
    return handleApiErrorForAction(error, { defaultMessage: 'メンバーの追加に失敗しました' });
  }
}
