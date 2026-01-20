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

// ===== 参加者選択関連 =====

/**
 * 参加者候補検索結果
 */
export interface AttendeeSearchResult {
  type: 'user' | 'workspace' | 'organization';
  id: number;
  name: string;
  email?: string;
  identityIconUrl?: string | null;
  memberCount?: number;
}

/**
 * 参加者候補を検索（ユーザー・ワークスペース統合検索）
 */
export async function searchAttendees(query: string): Promise<ApiResponse<AttendeeSearchResult[]>> {
  try {
    const api = await createPecusApiClients();
    const results: AttendeeSearchResult[] = [];

    // 空検索または2文字未満の場合は組織全体のみ表示
    if (!query || query.length < 2) {
      // 組織全体を候補に追加
      const orgUsers = await api.user.getApiUsersSearch('', 1000);
      results.push({
        type: 'organization',
        id: 0,
        name: '組織全体',
        memberCount: orgUsers.length,
      });
      return { success: true, data: results };
    }

    // ユーザー検索
    const users = await api.user.getApiUsersSearch(query, 10);
    for (const user of users) {
      results.push({
        type: 'user',
        id: user.id!,
        name: user.username!,
        email: user.email,
        identityIconUrl: user.identityIconUrl,
      });
    }

    // ワークスペース検索
    const workspaces = await api.workspace.getApiWorkspaces(1, undefined, query, undefined);
    for (const ws of workspaces.data ?? []) {
      results.push({
        type: 'workspace',
        id: ws.id!,
        name: ws.name!,
        memberCount: ws.memberCount ?? 0,
      });
    }

    // 組織全体も候補に追加（検索ワードに「組織」または「全体」が含まれる場合）
    if (query.includes('組織') || query.includes('全体') || query.includes('全員')) {
      const orgUsers = await api.user.getApiUsersSearch('', 1000);
      results.push({
        type: 'organization',
        id: 0,
        name: '組織全体',
        memberCount: orgUsers.length,
      });
    }

    return { success: true, data: results };
  } catch (error: unknown) {
    console.error('searchAttendees error:', error);
    return handleApiErrorForAction<AttendeeSearchResult[]>(error, {
      defaultMessage: '参加者の検索に失敗しました。',
    });
  }
}

/**
 * ワークスペース一覧（クイック選択用）
 */
export interface WorkspaceOption {
  id: number;
  name: string;
  memberCount: number;
}

/**
 * ワークスペース一覧を取得（ドロップダウン用）
 */
export async function fetchWorkspaceList(): Promise<ApiResponse<WorkspaceOption[]>> {
  try {
    const api = await createPecusApiClients();
    // getApiWorkspaces(page, genreId, name, mode) - ページサイズはAPIで固定
    // 複数ページ取得して全件を返す
    const allWorkspaces: WorkspaceOption[] = [];
    let currentPage = 1;
    let hasNextPage = true;

    while (hasNextPage) {
      const result = await api.workspace.getApiWorkspaces(currentPage);
      const workspaces =
        result.data?.map((ws) => ({
          id: ws.id!,
          name: ws.name!,
          memberCount: ws.memberCount ?? 0,
        })) ?? [];
      allWorkspaces.push(...workspaces);
      hasNextPage = result.hasNextPage ?? false;
      currentPage++;

      // 安全のため最大5ページまで
      if (currentPage > 5) break;
    }

    return { success: true, data: allWorkspaces };
  } catch (error: unknown) {
    console.error('fetchWorkspaceList error:', error);
    return handleApiErrorForAction<WorkspaceOption[]>(error, {
      defaultMessage: 'ワークスペース一覧の取得に失敗しました。',
    });
  }
}

/**
 * 組織のメンバー数を取得（ボタン表示用）
 */
export async function fetchOrganizationMemberCount(): Promise<ApiResponse<number>> {
  try {
    const api = await createPecusApiClients();
    // getApiMyOrganization で userCount を取得
    const org = await api.my.getApiMyOrganization();
    return { success: true, data: org.userCount ?? 0 };
  } catch (error: unknown) {
    console.error('fetchOrganizationMemberCount error:', error);
    return handleApiErrorForAction<number>(error, {
      defaultMessage: '組織メンバー数の取得に失敗しました。',
    });
  }
}

/**
 * ユーザーのみを検索（名前・メールで）
 */
export async function searchUsers(
  query: string,
): Promise<ApiResponse<{ userId: number; userName: string; email: string; identityIconUrl: string | null }[]>> {
  try {
    if (!query || query.length < 1) {
      return { success: true, data: [] };
    }

    const api = await createPecusApiClients();
    const users = await api.user.getApiUsersSearch(query, 10);
    const results = users.map((u) => ({
      userId: u.id!,
      userName: u.username!,
      email: u.email!,
      identityIconUrl: u.identityIconUrl ?? null,
    }));
    return { success: true, data: results };
  } catch (error: unknown) {
    console.error('searchUsers error:', error);
    return handleApiErrorForAction<
      { userId: number; userName: string; email: string; identityIconUrl: string | null }[]
    >(error, { defaultMessage: 'ユーザーの検索に失敗しました。' });
  }
}

/**
 * ワークスペースのメンバー一覧を取得（メンバー展開用）
 */
export async function fetchWorkspaceMembers(
  workspaceId: number,
): Promise<ApiResponse<{ userId: number; userName: string; email: string; identityIconUrl: string | null }[]>> {
  try {
    const api = await createPecusApiClients();
    const workspace = await api.workspace.getApiWorkspaces1(workspaceId);
    const members =
      workspace.members?.map((m) => ({
        userId: m.id!,
        userName: m.userName!,
        email: m.email!,
        identityIconUrl: m.identityIconUrl ?? null,
      })) ?? [];
    return { success: true, data: members };
  } catch (error: unknown) {
    console.error('fetchWorkspaceMembers error:', error);
    return handleApiErrorForAction<
      { userId: number; userName: string; email: string; identityIconUrl: string | null }[]
    >(error, { defaultMessage: 'ワークスペースメンバーの取得に失敗しました。' });
  }
}

/** 組織メンバー1件の型（APIクライアントの型を再エクスポート） */
export type { OrganizationMemberItem as OrganizationMember } from '@/connectors/api/pecus';

/** 参加者の最大人数 */
const MAX_ATTENDEES = 100;

/**
 * 組織の全メンバー一覧を取得（ページング対応、最大100人まで）
 * クライアント側でページを取得してマージします
 */
export async function fetchOrganizationMembers(): Promise<
  ApiResponse<{ userId: number; userName: string; email: string; identityIconUrl: string | null }[]>
> {
  try {
    const api = await createPecusApiClients();
    const allMembers: { userId: number; userName: string; email: string; identityIconUrl: string | null }[] = [];
    let currentPage = 1;
    let hasNextPage = true;

    // 100人に達するまでページを取得
    while (hasNextPage && allMembers.length < MAX_ATTENDEES) {
      const response = await api.user.getApiUsersOrganizationMembers(currentPage);

      // 100人を超えないように追加
      const remaining = MAX_ATTENDEES - allMembers.length;
      const toAdd = response.data.slice(0, remaining).map((m) => ({
        userId: m.userId ?? 0,
        userName: m.userName,
        email: m.email,
        identityIconUrl: m.identityIconUrl ?? null,
      }));
      allMembers.push(...toAdd);

      hasNextPage = response.hasNextPage ?? false;
      currentPage++;

      // 100人に達したら終了
      if (allMembers.length >= MAX_ATTENDEES) break;
    }

    return { success: true, data: allMembers };
  } catch (error: unknown) {
    console.error('fetchOrganizationMembers error:', error);
    return handleApiErrorForAction<
      { userId: number; userName: string; email: string; identityIconUrl: string | null }[]
    >(error, {
      defaultMessage: '組織メンバーの取得に失敗しました。',
    });
  }
}
