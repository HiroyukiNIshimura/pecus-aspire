'use server';

import { createPecusApiClients, parseErrorResponse } from '@/connectors/api/PecusApiClient';
import type {
  ChatMessageItem,
  ChatMessagesResponse,
  ChatRoomDetailResponse,
  ChatRoomItem,
  ChatRoomType,
  ChatUnreadCountByCategoryResponse,
  DmCandidateUserItem,
  UserSearchResultResponse,
} from '@/connectors/api/pecus';
import { type ApiResponse, serverError } from './types';

/**
 * Server Action: チャットルーム一覧を取得
 */
export async function getChatRooms(type?: ChatRoomType): Promise<ApiResponse<ChatRoomItem[]>> {
  try {
    const api = createPecusApiClients();
    const response = await api.chat.getApiChatRooms(type);
    return { success: true, data: response };
  } catch (error) {
    const errorDetail = parseErrorResponse(error);
    console.error('getChatRooms error:', errorDetail);
    return serverError(errorDetail.message || 'ルーム一覧の取得に失敗しました');
  }
}

/**
 * Server Action: ルーム詳細を取得
 */
export async function getChatRoomDetail(roomId: number): Promise<ApiResponse<ChatRoomDetailResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.chat.getApiChatRooms1(roomId);
    return { success: true, data: response };
  } catch (error) {
    const errorDetail = parseErrorResponse(error);
    console.error('getChatRoomDetail error:', errorDetail);
    return serverError(errorDetail.message || 'ルーム詳細の取得に失敗しました');
  }
}

/**
 * Server Action: DM ルームを作成または取得
 * 既存のDMルームがあればそれを返し、なければ新規作成
 * @param targetUserId DM相手のユーザーID
 */
export async function createOrGetDmRoom(targetUserId: number): Promise<ApiResponse<ChatRoomDetailResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.chat.postApiChatRoomsDm({ targetUserId });
    return { success: true, data: response };
  } catch (error) {
    const errorDetail = parseErrorResponse(error);
    console.error('createOrGetDmRoom error:', errorDetail);
    return serverError(errorDetail.message || 'DMルームの作成に失敗しました');
  }
}

/**
 * Server Action: カテゴリ別未読数を取得
 */
export async function getChatUnreadCounts(): Promise<ApiResponse<ChatUnreadCountByCategoryResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.chat.getApiChatUnreadByCategory();
    return { success: true, data: response };
  } catch (error) {
    const errorDetail = parseErrorResponse(error);
    console.error('getChatUnreadCounts error:', errorDetail);
    return serverError(errorDetail.message || '未読数の取得に失敗しました');
  }
}

/**
 * Server Action: メッセージ一覧を取得
 */
export async function getChatMessages(
  roomId: number,
  limit?: number,
  cursor?: number,
): Promise<ApiResponse<ChatMessagesResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.chat.getApiChatRoomsMessages(roomId, limit, cursor);
    return { success: true, data: response };
  } catch (error) {
    const errorDetail = parseErrorResponse(error);
    console.error('getChatMessages error:', errorDetail);
    return serverError(errorDetail.message || 'メッセージの取得に失敗しました');
  }
}

/**
 * Server Action: メッセージを送信
 */
export async function sendChatMessage(
  roomId: number,
  content: string,
  replyToMessageId?: number,
): Promise<ApiResponse<ChatMessageItem>> {
  try {
    const api = createPecusApiClients();
    const response = await api.chat.postApiChatRoomsMessages(roomId, {
      content,
      replyToMessageId,
    });
    return { success: true, data: response };
  } catch (error) {
    const errorDetail = parseErrorResponse(error);
    console.error('sendChatMessage error:', errorDetail);
    return serverError(errorDetail.message || 'メッセージの送信に失敗しました');
  }
}

/**
 * Server Action: 既読位置を更新
 * @param roomId ルームID
 * @param readAt 既読日時（ISO 8601形式）。省略時は現在時刻
 * @param readMessageId 既読したメッセージID（省略可能）
 */
export async function updateReadPosition(
  roomId: number,
  readAt?: string,
  readMessageId?: number,
): Promise<ApiResponse<void>> {
  try {
    const api = createPecusApiClients();
    await api.chat.putApiChatRoomsRead(roomId, {
      readAt: readAt ?? new Date().toISOString(),
      readMessageId,
    });
    return { success: true, data: undefined };
  } catch (error) {
    const errorDetail = parseErrorResponse(error);
    console.error('updateReadPosition error:', errorDetail);
    return serverError(errorDetail.message || '既読位置の更新に失敗しました');
  }
}

/**
 * Server Action: 入力中通知を送信
 * @param roomId ルームID
 * @param isTyping 入力中かどうか
 */
export async function notifyTyping(roomId: number, isTyping: boolean): Promise<ApiResponse<void>> {
  try {
    const api = createPecusApiClients();
    await api.chat.postApiChatRoomsTyping(roomId, { isTyping });
    return { success: true, data: undefined };
  } catch (error) {
    const errorDetail = parseErrorResponse(error);
    console.error('notifyTyping error:', errorDetail);
    return serverError(errorDetail.message || '入力中通知の送信に失敗しました');
  }
}

/**
 * Server Action: DM候補ユーザー一覧を取得
 * 既存DMがない、最近アクティブなユーザーを取得
 * @param limit 取得件数（デフォルト10、最大50）
 */
export async function getDmCandidateUsers(limit = 10): Promise<ApiResponse<DmCandidateUserItem[]>> {
  try {
    const api = createPecusApiClients();
    const response = await api.chat.getApiChatDmCandidates(limit);
    return { success: true, data: response };
  } catch (error) {
    const errorDetail = parseErrorResponse(error);
    console.error('getDmCandidateUsers error:', errorDetail);
    return serverError(errorDetail.message || 'DM候補ユーザーの取得に失敗しました');
  }
}

/**
 * Server Action: ユーザーをあいまい検索
 * @param query 検索クエリ（2文字以上）
 * @param limit 取得件数（デフォルト20、最大50）
 */
export async function searchUsers(query: string, limit = 20): Promise<ApiResponse<UserSearchResultResponse[]>> {
  try {
    const api = createPecusApiClients();
    const response = await api.user.getApiUsersSearch(query, limit);
    return { success: true, data: response };
  } catch (error) {
    const errorDetail = parseErrorResponse(error);
    console.error('searchUsers error:', errorDetail);
    return serverError(errorDetail.message || 'ユーザーの検索に失敗しました');
  }
}
