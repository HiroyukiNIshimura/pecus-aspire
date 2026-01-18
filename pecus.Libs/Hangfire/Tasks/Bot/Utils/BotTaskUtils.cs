using Pecus.Libs.DB.Models;

namespace Pecus.Libs.Hangfire.Tasks.Bot.Utils;

/// <summary>
/// Bot タスク共通のユーティリティメソッドを提供する静的クラス
/// </summary>
public static class BotTaskUtils
{
    /// <summary>
    /// Bot メッセージ用の SignalR 通知ペイロードを生成する
    /// </summary>
    /// <param name="room">チャットルーム</param>
    /// <param name="message">チャットメッセージ</param>
    /// <param name="bot">Bot</param>
    /// <returns>SignalR 通知ペイロード</returns>
    public static object BuildMessagePayload(
        ChatRoom room,
        ChatMessage message,
        DB.Models.Bot bot)
    {
        return new
        {
            RoomId = room.Id,
            RoomType = room.Type.ToString(),
            Message = new
            {
                message.Id,
                SenderActorId = bot.ChatActor!.Id,
                message.MessageType,
                message.Content,
                message.ReplyToMessageId,
                message.CreatedAt,
                Sender = new
                {
                    Id = bot.ChatActor.Id,
                    ActorType = bot.ChatActor.ActorType.ToString(),
                    UserId = (int?)null,
                    BotId = bot.Id,
                    DisplayName = bot.Name,
                    AvatarType = bot.ChatActor.AvatarType?.ToString()?.ToLowerInvariant(),
                    AvatarUrl = bot.IconUrl,
                    IdentityIconUrl = bot.IconUrl ?? "",
                    IsActive = true,
                },
            },
        };
    }

    /// <summary>
    /// 未読バッジ更新用の SignalR 通知ペイロードを生成する
    /// </summary>
    /// <param name="room">チャットルーム</param>
    /// <param name="senderActorId">送信者アクターID</param>
    /// <returns>未読バッジ更新ペイロード</returns>
    public static object BuildUnreadUpdatedPayload(
        ChatRoom room,
        int senderActorId)
    {
        return new
        {
            RoomId = room.Id,
            RoomType = room.Type.ToString(),
            SenderActorId = senderActorId,
        };
    }
}