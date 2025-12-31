import { redirect } from 'next/navigation';
import {
  createPecusApiClients,
  detect401ValidationError,
  getHttpErrorInfo,
  getUserSafeErrorMessage,
} from '@/connectors/api/PecusApiClient';
import { ServerSessionManager } from '@/libs/serverSession';
import ChatFullScreenClient from './ChatFullScreenClient';

/**
 * チャットページ（スマホ用フル画面）
 * SSR でルーム一覧を取得
 */
export default async function ChatPage() {
  try {
    const user = await ServerSessionManager.getUser();
    if (!user) {
      redirect('/signin');
    }

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
        currentUserId={user.id}
      />
    );
  } catch (error) {
    if (detect401ValidationError(error)) {
      redirect('/signin');
    }
    const info = getHttpErrorInfo(error);
    console.error('ChatPage: Failed to fetch chat data', {
      status: info.status,
      message: getUserSafeErrorMessage(error, 'チャットデータの取得に失敗しました'),
    });

    // エラー時はサインインへリダイレクト
    redirect('/signin');
  }
}
