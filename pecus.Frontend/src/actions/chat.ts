'use server';

import { createPecusApiClients, parseErrorResponse } from '@/connectors/api/PecusApiClient';
import type { ChatRoomItem, ChatRoomType, ChatUnreadCountByCategoryResponse } from '@/connectors/api/pecus';
import type { ApiResponse } from './types';

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
    return { success: false, error: errorDetail.message || 'ルーム一覧の取得に失敗しました' };
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
    return { success: false, error: errorDetail.message || '未読数の取得に失敗しました' };
  }
}
