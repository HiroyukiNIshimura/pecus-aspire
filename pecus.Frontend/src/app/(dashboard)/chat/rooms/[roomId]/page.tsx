import { redirect } from 'next/navigation';
import {
  getChatRoomByIdWithHeyApi,
  getChatRoomMessagesWithHeyApi,
  getProfileWithHeyApi,
  getWorkspaceByIdWithHeyApi,
} from '@/connectors/HeyApiClient';
import type { ChatMessageItem, ChatMessageItem as HeyChatMessageItem } from '@/connectors/hey-api-axios/types.gen';
import { detect401ValidationError, getHttpErrorInfo, getUserSafeErrorMessage } from '@/libs/apiError';
import ChatRoomMessageClient from './ChatRoomMessageClient';

interface ChatRoomPageProps {
  params: Promise<{ roomId: string }>;
}

function normalizeChatMessage(message: HeyChatMessageItem): ChatMessageItem {
  return {
    ...message,
    senderUserId: message.senderUserId ?? undefined,
    sender: message.sender ?? undefined,
    replyToMessageId: message.replyToMessageId ?? undefined,
    replyTo: message.replyTo ?? undefined,
  };
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
    const roomResponse = await getChatRoomByIdWithHeyApi(roomIdNum);
    const [messagesResponse, profileResponse, workspaceResponse] = await Promise.all([
      getChatRoomMessagesWithHeyApi(roomIdNum),
      getProfileWithHeyApi(),
      roomResponse.workspaceId != null ? getWorkspaceByIdWithHeyApi(roomResponse.workspaceId) : null,
    ]);

    return (
      <ChatRoomMessageClient
        room={roomResponse}
        initialMessages={messagesResponse.messages.map(normalizeChatMessage)}
        hasMore={messagesResponse.hasMore ?? false}
        nextCursor={messagesResponse.nextCursor ?? null}
        currentUserId={profileResponse.id}
        workspaceCode={workspaceResponse?.code ?? undefined}
      />
    );
  } catch (error) {
    if (detect401ValidationError(error)) {
      redirect('/signin');
    }
    const info = getHttpErrorInfo(error);
    console.error('ChatRoomPage: Failed to fetch data', {
      status: info.status,
      message: getUserSafeErrorMessage(error, 'チャットデータの取得に失敗しました'),
    });

    // エラー時はチャット一覧に戻る
    redirect('/chat');
  }
}
