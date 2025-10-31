'use server';

import { createPecusApiClients } from '@/connectors/api/PecusApiClient';
import { ApiResponse } from '../types';

/**
 * Server Action: スキル一覧を取得（ページネーション対応）
 */
export async function getSkills(
  page: number = 1,
  isActive: boolean = true
): Promise<ApiResponse<any>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminSkill.getApiAdminSkills(page, isActive);
    return { success: true, data: response };
  } catch (error: any) {
    console.error('Failed to fetch skills:', error);
    return {
      success: false,
      error: error.body?.message || error.message || 'スキル一覧の取得に失敗しました'
    };
  }
}

/**
 * Server Action: スキル情報を取得
 */
export async function getSkillDetail(
  id: number
): Promise<ApiResponse<any>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminSkill.getApiAdminSkills1(id);
    return { success: true, data: response };
  } catch (error: any) {
    console.error('Failed to fetch skill detail:', error);
    return {
      success: false,
      error: error.body?.message || error.message || 'スキル情報の取得に失敗しました'
    };
  }
}

/**
 * Server Action: スキルを作成
 */
export async function createSkill(request: {
  name: string;
  description?: string;
}): Promise<ApiResponse<any>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminSkill.postApiAdminSkills(request);
    return { success: true, data: response };
  } catch (error: any) {
    console.error('Failed to create skill:', error);
    return {
      success: false,
      error: error.body?.message || error.message || 'スキルの作成に失敗しました'
    };
  }
}

/**
 * Server Action: スキルを更新
 */
export async function updateSkill(
  id: number,
  request: {
    name: string;
    description?: string;
  }
): Promise<ApiResponse<any>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminSkill.putApiAdminSkills(id, request);
    return { success: true, data: response };
  } catch (error: any) {
    console.error('Failed to update skill:', error);
    return {
      success: false,
      error: error.body?.message || error.message || 'スキルの更新に失敗しました'
    };
  }
}

/**
 * Server Action: スキルを削除
 */
export async function deleteSkill(id: number): Promise<ApiResponse<any>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminSkill.deleteApiAdminSkills(id);
    return { success: true, data: response };
  } catch (error: any) {
    console.error('Failed to delete skill:', error);
    return {
      success: false,
      error: error.body?.message || error.message || 'スキルの削除に失敗しました'
    };
  }
}

/**
 * Server Action: スキルを有効化
 */
export async function activateSkill(id: number): Promise<ApiResponse<any>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminSkill.patchApiAdminSkillsActivate(id);
    return { success: true, data: response };
  } catch (error: any) {
    console.error('Failed to activate skill:', error);
    return {
      success: false,
      error: error.body?.message || error.message || 'スキルの有効化に失敗しました'
    };
  }
}

/**
 * Server Action: スキルを無効化
 */
export async function deactivateSkill(id: number): Promise<ApiResponse<any>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminSkill.patchApiAdminSkillsDeactivate(id);
    return { success: true, data: response };
  } catch (error: any) {
    console.error('Failed to deactivate skill:', error);
    return {
      success: false,
      error: error.body?.message || error.message || 'スキルの無効化に失敗しました'
    };
  }
}
