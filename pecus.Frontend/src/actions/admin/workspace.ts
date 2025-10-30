'use server';

import { createPecusApiClients } from '@/connectors/api/PecusApiClient';
import { ApiResponse } from '../types';

/**
 * Server Action: ワークスペース一覧を取得
 */
export async function getWorkspaces(
  page: number = 1,
  activeOnly: boolean = true
): Promise<ApiResponse<any>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminWorkspace.apiAdminWorkspacesGet({ page, activeOnly });
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error('Failed to fetch workspaces:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch workspaces'
    };
  }
}

/**
 * Server Action: ワークスペースを作成
 */
export async function createWorkspace(request: {
  organizationId: number;
  name: string;
  description?: string;
  genreId: number;
}): Promise<ApiResponse<any>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminWorkspace.apiAdminWorkspacesPost({
      createWorkspaceRequest: request
    });
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error('Failed to create workspace:', error);
    return {
      success: false,
      error: error.message || 'Failed to create workspace'
    };
  }
}

/**
 * Server Action: ワークスペースを更新
 */
export async function updateWorkspace(
  workspaceId: number,
  request: {
    name?: string;
    description?: string;
    genreId?: number;
  }
): Promise<ApiResponse<any>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminWorkspace.apiAdminWorkspacesIdPut({
      id: workspaceId,
      updateWorkspaceRequest: request,
    });
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error('Failed to update workspace:', error);
    return {
      success: false,
      error: error.message || 'Failed to update workspace'
    };
  }
}

/**
 * Server Action: ワークスペースを削除
 */
export async function deleteWorkspace(workspaceId: number): Promise<ApiResponse<any>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminWorkspace.apiAdminWorkspacesIdDelete({ id: workspaceId });
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error('Failed to delete workspace:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete workspace'
    };
  }
}

/**
 * Server Action: ワークスペースを有効化
 */
export async function activateWorkspace(workspaceId: number): Promise<ApiResponse<any>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminWorkspace.apiAdminWorkspacesIdActivatePatch({ id: workspaceId });
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error('Failed to activate workspace:', error);
    return {
      success: false,
      error: error.message || 'Failed to activate workspace'
    };
  }
}

/**
 * Server Action: ワークスペースを無効化
 */
export async function deactivateWorkspace(workspaceId: number): Promise<ApiResponse<any>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminWorkspace.apiAdminWorkspacesIdDeactivatePatch({ id: workspaceId });
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error('Failed to deactivate workspace:', error);
    return {
      success: false,
      error: error.message || 'Failed to deactivate workspace'
    };
  }
}
