import { z } from 'zod';

export const getChatRoomsInputSchema = z.object({
  type: z.enum(['Dm', 'Ai'], { error: 'ルーム種別が不正です。' }).optional(),
});

export type GetChatRoomsInput = z.infer<typeof getChatRoomsInputSchema>;

export const getChatRoomDetailInputSchema = z.object({
  roomId: z.number({ error: 'ルームIDが不正です。' }).int('ルームIDが不正です。').positive('ルームIDが不正です。'),
});

export type GetChatRoomDetailInput = z.infer<typeof getChatRoomDetailInputSchema>;

export const createOrGetDmRoomInputSchema = z.object({
  targetUserId: z
    .number({ error: 'ユーザーIDが不正です。' })
    .int('ユーザーIDが不正です。')
    .positive('ユーザーIDが不正です。'),
});

export type CreateOrGetDmRoomInput = z.infer<typeof createOrGetDmRoomInputSchema>;

export const createOrGetAiRoomInputSchema = z.object({});

export type CreateOrGetAiRoomInput = z.infer<typeof createOrGetAiRoomInputSchema>;

export const sendChatMessageInputSchema = z.object({
  roomId: z.number({ error: 'ルームIDが不正です。' }).int('ルームIDが不正です。').positive('ルームIDが不正です。'),
  content: z.string({ error: 'メッセージが不正です。' }).min(1, 'メッセージを入力してください。'),
  replyToMessageId: z
    .number({ error: '返信先メッセージIDが不正です。' })
    .int('返信先メッセージIDが不正です。')
    .positive('返信先メッセージIDが不正です。')
    .optional(),
});

export type SendChatMessageInput = z.infer<typeof sendChatMessageInputSchema>;

export const updateReadPositionInputSchema = z.object({
  roomId: z.number({ error: 'ルームIDが不正です。' }).int('ルームIDが不正です。').positive('ルームIDが不正です。'),
  readAt: z.string({ error: '既読日時が不正です。' }).optional(),
  readMessageId: z
    .number({ error: '既読メッセージIDが不正です。' })
    .int('既読メッセージIDが不正です。')
    .positive('既読メッセージIDが不正です。')
    .optional(),
});

export type UpdateReadPositionInput = z.infer<typeof updateReadPositionInputSchema>;

export const notifyTypingInputSchema = z.object({
  roomId: z.number({ error: 'ルームIDが不正です。' }).int('ルームIDが不正です。').positive('ルームIDが不正です。'),
  isTyping: z.boolean({ error: '入力状態が不正です。' }),
});

export type NotifyTypingInput = z.infer<typeof notifyTypingInputSchema>;

export const searchUsersInputSchema = z.object({
  query: z.string({ error: '検索クエリが不正です。' }).min(2, '2文字以上入力してください'),
  limit: z
    .number({ error: '取得件数が不正です。' })
    .int('取得件数が不正です。')
    .min(1, '取得件数が不正です。')
    .max(50, '取得件数が不正です。')
    .optional(),
});

export type SearchUsersInput = z.infer<typeof searchUsersInputSchema>;

export const getDmCandidateUsersInputSchema = z.object({
  limit: z
    .number({ error: '取得件数が不正です。' })
    .int('取得件数が不正です。')
    .min(1, '取得件数が不正です。')
    .max(50, '取得件数が不正です。')
    .optional(),
});

export type GetDmCandidateUsersInput = z.infer<typeof getDmCandidateUsersInputSchema>;

export const getChatMessagesInputSchema = z.object({
  roomId: z.number({ error: 'ルームIDが不正です。' }).int('ルームIDが不正です。').positive('ルームIDが不正です。'),
  limit: z
    .number({ error: '取得件数が不正です。' })
    .int('取得件数が不正です。')
    .min(1, '取得件数が不正です。')
    .max(200, '取得件数が不正です。')
    .optional(),
  cursor: z
    .number({ error: 'カーソルが不正です。' })
    .int('カーソルが不正です。')
    .positive('カーソルが不正です。')
    .optional(),
});

export type GetChatMessagesInput = z.infer<typeof getChatMessagesInputSchema>;
