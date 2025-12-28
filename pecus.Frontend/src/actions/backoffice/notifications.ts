'use server';

import { createPecusApiClients, parseErrorResponse } from '@/connectors/api/PecusApiClient';
import type {
  BackOfficeCreateNotificationRequest,
  BackOfficeNotificationDetailResponse,
  BackOfficeUpdateNotificationRequest,
  PagedResponseOfBackOfficeNotificationListItemResponse,
} from '@/connectors/api/pecus';
import type { ApiResponse } from '../types';

/**
 * Server Action: BackOffice - システム通知一覧を取得（ページネーション付き）
 */
export async function getBackOfficeNotifications(
  page?: number,
  pageSize?: number,
  includeDeleted?: boolean,
): Promise<ApiResponse<PagedResponseOfBackOfficeNotificationListItemResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.backOfficeNotifications.getApiBackofficeNotifications(page, pageSize, includeDeleted);
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to fetch backoffice notifications:', error);
    return parseErrorResponse(error, 'システム通知一覧の取得に失敗しました');
  }
}

/**
 * Server Action: BackOffice - システム通知詳細を取得
 */
export async function getBackOfficeNotificationDetail(
  id: number,
): Promise<ApiResponse<BackOfficeNotificationDetailResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.backOfficeNotifications.getApiBackofficeNotifications1(id);
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to fetch backoffice notification detail:', error);
    return parseErrorResponse(error, 'システム通知詳細の取得に失敗しました');
  }
}

/**
 * Server Action: BackOffice - システム通知を作成
 */
export async function createBackOfficeNotification(
  request: BackOfficeCreateNotificationRequest,
): Promise<ApiResponse<BackOfficeNotificationDetailResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.backOfficeNotifications.postApiBackofficeNotifications(request);
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to create backoffice notification:', error);
    return parseErrorResponse(error, 'システム通知の作成に失敗しました');
  }
}

/**
 * Server Action: BackOffice - システム通知を更新（公開前のみ）
 */
export async function updateBackOfficeNotification(
  id: number,
  request: BackOfficeUpdateNotificationRequest,
): Promise<ApiResponse<BackOfficeNotificationDetailResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.backOfficeNotifications.putApiBackofficeNotifications(id, request);
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to update backoffice notification:', error);
    return parseErrorResponse(error, 'システム通知の更新に失敗しました');
  }
}

/**
 * Server Action: BackOffice - システム通知を削除（論理削除）
 * @param deleteMessages 配信済みメッセージも削除するか
 * @param rowVersion 楽観的ロック用バージョン番号
 */
export async function deleteBackOfficeNotification(
  id: number,
  rowVersion: number,
  deleteMessages: boolean = false,
): Promise<ApiResponse<void>> {
  try {
    const api = createPecusApiClients();
    await api.backOfficeNotifications.deleteApiBackofficeNotifications(id, {
      deleteMessages,
      rowVersion,
    });
    return { success: true, data: undefined };
  } catch (error) {
    console.error('Failed to delete backoffice notification:', error);
    return parseErrorResponse(error, 'システム通知の削除に失敗しました');
  }
}
