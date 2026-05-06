'use server';

import { createPecusApiClients } from '@/connectors/api/PecusApiClient';
import type {
  BackOfficeNotificationDetailResponse,
  PagedResponseOfBackOfficeNotificationListItemResponse,
} from '@/connectors/api/pecus';
import {
  type CreateBackOfficeNotificationInput,
  createBackOfficeNotificationInputSchema,
  type DeleteBackOfficeNotificationInput,
  deleteBackOfficeNotificationInputSchema,
  type GetBackOfficeNotificationDetailInput,
  type GetBackOfficeNotificationsInput,
  getBackOfficeNotificationDetailInputSchema,
  getBackOfficeNotificationsInputSchema,
  type UpdateBackOfficeNotificationInput,
  updateBackOfficeNotificationInputSchema,
} from '@/schemas/backofficeNotificationSchemas';
import { handleApiErrorForAction } from '../apiErrorPolicy';
import type { ApiResponse } from '../types';
import { validationError } from '../types';

/**
 * Server Action: BackOffice - システム通知一覧を取得（ページネーション付き）
 */
export async function getBackOfficeNotifications(
  input: GetBackOfficeNotificationsInput = {},
): Promise<ApiResponse<PagedResponseOfBackOfficeNotificationListItemResponse>> {
  const parseResult = getBackOfficeNotificationsInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const api = createPecusApiClients();
    const response = await api.backOfficeNotifications.getApiBackofficeNotifications(
      parseResult.data.page,
      parseResult.data.pageSize,
      parseResult.data.includeDeleted,
    );
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to fetch backoffice notifications:', error);
    return handleApiErrorForAction(error, { defaultMessage: 'システム通知一覧の取得に失敗しました' });
  }
}

/**
 * Server Action: BackOffice - システム通知詳細を取得
 */
export async function getBackOfficeNotificationDetail(
  input: GetBackOfficeNotificationDetailInput,
): Promise<ApiResponse<BackOfficeNotificationDetailResponse>> {
  const parseResult = getBackOfficeNotificationDetailInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const api = createPecusApiClients();
    const response = await api.backOfficeNotifications.getApiBackofficeNotifications1(parseResult.data.id);
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to fetch backoffice notification detail:', error);
    return handleApiErrorForAction(error, { defaultMessage: 'システム通知詳細の取得に失敗しました' });
  }
}

/**
 * Server Action: BackOffice - システム通知を作成
 */
export async function createBackOfficeNotification(
  input: CreateBackOfficeNotificationInput,
): Promise<ApiResponse<BackOfficeNotificationDetailResponse>> {
  const parseResult = createBackOfficeNotificationInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const api = createPecusApiClients();
    const response = await api.backOfficeNotifications.postApiBackofficeNotifications(parseResult.data);
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to create backoffice notification:', error);
    return handleApiErrorForAction(error, { defaultMessage: 'システム通知の作成に失敗しました' });
  }
}

/**
 * Server Action: BackOffice - システム通知を更新（公開前のみ）
 */
export async function updateBackOfficeNotification(
  input: UpdateBackOfficeNotificationInput,
): Promise<ApiResponse<BackOfficeNotificationDetailResponse>> {
  const parseResult = updateBackOfficeNotificationInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const api = createPecusApiClients();
    const response = await api.backOfficeNotifications.putApiBackofficeNotifications(
      parseResult.data.id,
      parseResult.data.request,
    );
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to update backoffice notification:', error);
    return handleApiErrorForAction(error, { defaultMessage: 'システム通知の更新に失敗しました' });
  }
}

/**
 * Server Action: BackOffice - システム通知を削除（論理削除）
 * @param deleteMessages 配信済みメッセージも削除するか
 * @param rowVersion 楽観的ロック用バージョン番号
 */
export async function deleteBackOfficeNotification(
  input: DeleteBackOfficeNotificationInput,
): Promise<ApiResponse<void>> {
  const parseResult = deleteBackOfficeNotificationInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const api = createPecusApiClients();
    await api.backOfficeNotifications.deleteApiBackofficeNotifications(parseResult.data.id, {
      deleteMessages: parseResult.data.deleteMessages ?? false,
      rowVersion: parseResult.data.rowVersion,
    });
    return { success: true, data: undefined };
  } catch (error) {
    console.error('Failed to delete backoffice notification:', error);
    return handleApiErrorForAction(error, { defaultMessage: 'システム通知の削除に失敗しました' });
  }
}
