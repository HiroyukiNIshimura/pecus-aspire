import { redirect } from 'next/navigation';
import { createPecusApiClients, detect401ValidationError, parseErrorResponse } from '@/connectors/api/PecusApiClient';
import ChatFullScreenClient from './ChatFullScreenClient';

/**
 * チャットページ（スマホ用フル画面）
 * SSR でルーム一覧を取得
 */
export default async function ChatPage() {
  try {
    const api = createPecusApiClients();
    const [rooms, unreadCounts] = await Promise.all([
      api.chat.getApiChatRooms(),
      api.chat.getApiChatUnreadByCategory(),
    ]);

    return (
      <ChatFullScreenClient
        initialRooms={rooms}
        initialUnreadCounts={{
          total: unreadCounts.totalUnreadCount,
          dm: unreadCounts.dmUnreadCount,
          group: unreadCounts.groupUnreadCount,
          ai: unreadCounts.aiUnreadCount,
          system: unreadCounts.systemUnreadCount,
        }}
      />
    );
  } catch (error) {
    if (detect401ValidationError(error)) {
      redirect('/signin');
    }
    const errorDetail = parseErrorResponse(error);
    console.error('ChatPage: Failed to fetch chat data', errorDetail);

    // エラー時は空のデータで表示
    return (
      <ChatFullScreenClient
        initialRooms={[]}
        initialUnreadCounts={{
          total: 0,
          dm: 0,
          group: 0,
          ai: 0,
          system: 0,
        }}
      />
    );
  }
}
