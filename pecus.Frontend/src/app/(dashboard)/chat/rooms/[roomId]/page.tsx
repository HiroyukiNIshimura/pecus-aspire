import { redirect } from 'next/navigation';
import { createPecusApiClients, detect401ValidationError, parseErrorResponse } from '@/connectors/api/PecusApiClient';
import ChatRoomMessageClient from './ChatRoomMessageClient';

interface ChatRoomPageProps {
  params: Promise<{ roomId: string }>;
}

/**
 * チャットルームメッセージページ（スマホ用フル画面）
 * SSR でルーム詳細とメッセージを取得
 */
export default async function ChatRoomPage({ params }: ChatRoomPageProps) {
  const { roomId } = await params;
  const roomIdNum = Number.parseInt(roomId, 10);

  if (Number.isNaN(roomIdNum)) {
    redirect('/chat');
  }

  try {
    const api = createPecusApiClients();
    const [roomResponse, messagesResponse, profileResponse] = await Promise.all([
      api.chat.getApiChatRooms1(roomIdNum),
      api.chat.getApiChatRoomsMessages(roomIdNum),
      api.profile.getApiProfile(),
    ]);

    return (
      <ChatRoomMessageClient
        room={roomResponse}
        initialMessages={messagesResponse.messages}
        hasMore={messagesResponse.hasMore ?? false}
        nextCursor={messagesResponse.nextCursor ?? null}
        currentUserId={profileResponse.id}
      />
    );
  } catch (error) {
    if (detect401ValidationError(error)) {
      redirect('/signin');
    }
    const errorDetail = parseErrorResponse(error);
    console.error('ChatRoomPage: Failed to fetch data', errorDetail);

    // エラー時はチャット一覧に戻る
    redirect('/chat');
  }
}
