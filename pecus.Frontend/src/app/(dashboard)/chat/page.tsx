import { redirect } from 'next/navigation';
import { getChatRoomsWithHeyApi, getChatUnreadByCategoryWithHeyApi } from '@/connectors/HeyApiClient';
import type {
  ChatRoomItem,
  ChatMessageItem as HeyChatMessageItem,
  ChatRoomItem as HeyChatRoomItem,
} from '@/connectors/hey-api-axios/types.gen';
import { detect401ValidationError, getHttpErrorInfo, getUserSafeErrorMessage } from '@/libs/apiError';
import { ServerSessionManager } from '@/libs/serverSession';
import ChatFullScreenClient from './ChatFullScreenClient';

function normalizeChatMessage(message: HeyChatMessageItem) {
  return {
    ...message,
    senderUserId: message.senderUserId ?? undefined,
    sender: message.sender ?? undefined,
    replyToMessageId: message.replyToMessageId ?? undefined,
    replyTo: message.replyTo ?? undefined,
  };
}

function normalizeChatRoom(room: HeyChatRoomItem): ChatRoomItem {
  return {
    ...room,
    name: room.name ?? undefined,
    workspaceId: room.workspaceId ?? undefined,
    otherUser: room.otherUser ?? undefined,
    latestMessage: room.latestMessage ? normalizeChatMessage(room.latestMessage) : undefined,
  };
}

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

    const [rooms, unreadCounts] = await Promise.all([getChatRoomsWithHeyApi(), getChatUnreadByCategoryWithHeyApi()]);

    return (
      <ChatFullScreenClient
        initialRooms={rooms.map(normalizeChatRoom)}
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
