'use server';

import { createPecusApiClients } from '@/connectors/api/PecusApiClient';
import type {
  AgendaExceptionResponse,
  AgendaNotificationCountResponse,
  AgendaNotificationResponse,
  AgendaOccurrenceResponse,
  AgendaOccurrencesResponse,
  AgendaResponse,
  AttendanceStatus,
  CancelAgendaRequest,
  CreateAgendaExceptionRequest,
  CreateAgendaRequest,
  UpdateAgendaRequest,
  UpdateAttendanceRequest,
} from '@/connectors/api/pecus';
import { handleApiErrorForAction } from './apiErrorPolicy';
import type { ApiResponse } from './types';

/**
 * 直近のアジェンダオカレンス一覧を取得（タイムライン表示用）
 * @deprecated 代わりに fetchRecentOccurrencesPaginated を使用してください
 */
export async function fetchRecentOccurrences(limit: number = 50): Promise<ApiResponse<AgendaOccurrenceResponse[]>> {
  try {
    const api = await createPecusApiClients();
    const result = await api.agenda.getApiAgendasOccurrencesRecent(limit);
    return { success: true, data: result.items };
  } catch (error: unknown) {
    console.error('fetchRecentOccurrences error:', error);
    return handleApiErrorForAction<AgendaOccurrenceResponse[]>(error, {
      defaultMessage: 'アジェンダの取得に失敗しました。',
    });
  }
}

/**
 * 直近のアジェンダオカレンス一覧を取得（ページネーション対応）
 */
export async function fetchRecentOccurrencesPaginated(
  limit: number = 20,
  cursor?: string,
): Promise<ApiResponse<AgendaOccurrencesResponse>> {
  try {
    const api = await createPecusApiClients();
    const result = await api.agenda.getApiAgendasOccurrencesRecent(limit, cursor);
    return { success: true, data: result };
  } catch (error: unknown) {
    console.error('fetchRecentOccurrencesPaginated error:', error);
    return handleApiErrorForAction<AgendaOccurrencesResponse>(error, {
      defaultMessage: 'アジェンダの取得に失敗しました。',
    });
  }
}

/**
 * 期間指定でアジェンダオカレンス一覧を取得
 */
export async function fetchOccurrences(
  startAt: string,
  endAt: string,
): Promise<ApiResponse<AgendaOccurrenceResponse[]>> {
  try {
    const api = await createPecusApiClients();
    const result = await api.agenda.getApiAgendasOccurrences(startAt, endAt);
    return { success: true, data: result };
  } catch (error: unknown) {
    console.error('fetchOccurrences error:', error);
    return handleApiErrorForAction<AgendaOccurrenceResponse[]>(error, {
      defaultMessage: 'アジェンダの取得に失敗しました。',
    });
  }
}

/**
 * 参加状況を更新
 */
export async function updateAttendance(agendaId: number, status: AttendanceStatus): Promise<ApiResponse<void>> {
  try {
    const api = await createPecusApiClients();
    const request: UpdateAttendanceRequest = { status };
    await api.agenda.patchApiAgendasAttendance(agendaId, request);
    return { success: true, data: undefined };
  } catch (error: unknown) {
    console.error('updateAttendance error:', error);
    return handleApiErrorForAction<void>(error, {
      defaultMessage: '参加状況の更新に失敗しました。',
    });
  }
}

/**
 * アジェンダをキャンセル（シリーズ全体）
 */
export async function cancelAgenda(agendaId: number, rowVersion: number, reason?: string): Promise<ApiResponse<void>> {
  try {
    const api = await createPecusApiClients();
    const request: CancelAgendaRequest = { reason, rowVersion };
    await api.agenda.patchApiAgendasCancel(agendaId, request);
    return { success: true, data: undefined };
  } catch (error: unknown) {
    console.error('cancelAgenda error:', error);
    return handleApiErrorForAction<void>(error, {
      defaultMessage: 'アジェンダの中止に失敗しました。',
    });
  }
}

/**
 * 特定回をキャンセル（例外作成）
 */
export async function cancelOccurrence(
  agendaId: number,
  originalStartAt: string,
  reason?: string,
): Promise<ApiResponse<void>> {
  try {
    const api = await createPecusApiClients();
    const request: CreateAgendaExceptionRequest = {
      originalStartAt,
      isCancelled: true,
      cancellationReason: reason,
    };
    await api.agenda.postApiAgendasExceptions(agendaId, request);
    return { success: true, data: undefined };
  } catch (error: unknown) {
    console.error('cancelOccurrence error:', error);
    return handleApiErrorForAction<void>(error, {
      defaultMessage: 'この回の中止に失敗しました。',
    });
  }
}

/**
 * アジェンダ詳細を取得
 */
export async function fetchAgendaById(agendaId: number): Promise<ApiResponse<AgendaResponse>> {
  try {
    const api = await createPecusApiClients();
    const result = await api.agenda.getApiAgendas1(agendaId);
    return { success: true, data: result };
  } catch (error: unknown) {
    console.error('fetchAgendaById error:', error);
    return handleApiErrorForAction<AgendaResponse>(error, {
      defaultMessage: 'アジェンダの取得に失敗しました。',
    });
  }
}

/**
 * アジェンダの例外一覧を取得（繰り返しアジェンダ用）
 */
export async function fetchAgendaExceptions(agendaId: number): Promise<ApiResponse<AgendaExceptionResponse[]>> {
  try {
    const api = await createPecusApiClients();
    const result = await api.agenda.getApiAgendasExceptions(agendaId);
    return { success: true, data: result };
  } catch (error: unknown) {
    console.error('fetchAgendaExceptions error:', error);
    return handleApiErrorForAction<AgendaExceptionResponse[]>(error, {
      defaultMessage: '例外の取得に失敗しました。',
    });
  }
}

/**
 * アジェンダを作成
 */
export async function createAgenda(request: CreateAgendaRequest): Promise<ApiResponse<AgendaResponse>> {
  try {
    const api = await createPecusApiClients();
    const result = await api.agenda.postApiAgendas(request);
    return { success: true, data: result };
  } catch (error: unknown) {
    console.error('createAgenda error:', error);
    return handleApiErrorForAction<AgendaResponse>(error, {
      defaultMessage: 'アジェンダの作成に失敗しました。',
    });
  }
}

/**
 * アジェンダを更新（シリーズ全体）
 */
export async function updateAgenda(
  agendaId: number,
  request: UpdateAgendaRequest,
): Promise<ApiResponse<AgendaResponse>> {
  try {
    const api = await createPecusApiClients();
    const result = await api.agenda.putApiAgendas(agendaId, request);
    return { success: true, data: result };
  } catch (error: unknown) {
    console.error('updateAgenda error:', error);
    return handleApiErrorForAction<AgendaResponse>(error, {
      defaultMessage: 'アジェンダの更新に失敗しました。',
    });
  }
}

// ===== 通知関連 =====

/**
 * 通知件数を取得（ヘッダーバッジ用）
 */
export async function fetchNotificationCount(): Promise<ApiResponse<AgendaNotificationCountResponse>> {
  try {
    const api = await createPecusApiClients();
    const result = await api.agendaNotification.getApiAgendasNotificationsCount();
    return { success: true, data: result };
  } catch (error: unknown) {
    console.error('fetchNotificationCount error:', error);
    return handleApiErrorForAction<AgendaNotificationCountResponse>(error, {
      defaultMessage: '通知数の取得に失敗しました。',
    });
  }
}

/**
 * 通知一覧を取得
 */
export async function fetchNotifications(
  limit: number = 50,
  beforeId?: number,
  unreadOnly: boolean = false,
): Promise<ApiResponse<AgendaNotificationResponse[]>> {
  try {
    const api = await createPecusApiClients();
    const result = await api.agendaNotification.getApiAgendasNotifications(limit, beforeId, unreadOnly);
    return { success: true, data: result };
  } catch (error: unknown) {
    console.error('fetchNotifications error:', error);
    return handleApiErrorForAction<AgendaNotificationResponse[]>(error, {
      defaultMessage: '通知の取得に失敗しました。',
    });
  }
}

/**
 * 通知を既読にする（個別）
 */
export async function markNotificationAsRead(notificationId: number): Promise<ApiResponse<void>> {
  try {
    const api = await createPecusApiClients();
    await api.agendaNotification.postApiAgendasNotificationsRead(notificationId);
    return { success: true, data: undefined };
  } catch (error: unknown) {
    console.error('markNotificationAsRead error:', error);
    return handleApiErrorForAction<void>(error, {
      defaultMessage: '通知の既読処理に失敗しました。',
    });
  }
}

/**
 * 通知を一括既読にする
 */
export async function markAllNotificationsAsRead(
  notificationIds?: number[],
): Promise<ApiResponse<{ markedCount: number }>> {
  try {
    const api = await createPecusApiClients();
    const result = await api.agendaNotification.postApiAgendasNotificationsRead1({
      notificationIds: notificationIds ?? null,
    });
    return { success: true, data: { markedCount: result.markedCount ?? 0 } };
  } catch (error: unknown) {
    console.error('markAllNotificationsAsRead error:', error);
    return handleApiErrorForAction<{ markedCount: number }>(error, {
      defaultMessage: '通知の一括既読処理に失敗しました。',
    });
  }
}
