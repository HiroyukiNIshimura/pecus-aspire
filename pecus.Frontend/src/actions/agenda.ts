'use server';

import { createPecusApiClients } from '@/connectors/api/PecusApiClient';
import type {
  AgendaOccurrenceResponse,
  AttendanceStatus,
  CancelAgendaRequest,
  CreateAgendaExceptionRequest,
  UpdateAttendanceRequest,
} from '@/connectors/api/pecus';
import { handleApiErrorForAction } from './apiErrorPolicy';
import type { ApiResponse } from './types';

/**
 * 直近のアジェンダオカレンス一覧を取得（タイムライン表示用）
 */
export async function fetchRecentOccurrences(limit: number = 50): Promise<ApiResponse<AgendaOccurrenceResponse[]>> {
  try {
    const api = await createPecusApiClients();
    const result = await api.agenda.getApiAgendasOccurrencesRecent(limit);
    return { success: true, data: result };
  } catch (error: unknown) {
    console.error('fetchRecentOccurrences error:', error);
    return handleApiErrorForAction<AgendaOccurrenceResponse[]>(error, {
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
