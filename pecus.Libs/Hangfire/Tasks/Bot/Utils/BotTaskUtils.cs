using Pecus.Libs.DB.Models;

namespace Pecus.Libs.Hangfire.Tasks.Bot.Utils;

/// <summary>
/// Bot タスク共通のユーティリティメソッドを提供する静的クラス
/// </summary>
public static class BotTaskUtils
{
    /// <summary>
    /// Bot から組織のChatActorを取得する（最初の1件）
    /// </summary>
    /// <param name="bot">Bot</param>
    /// <returns>ChatActor、見つからない場合はnull</returns>
    public static ChatActor? GetChatActor(this DB.Models.Bot bot)
    {
        return bot.ChatActors.FirstOrDefault();
    }

    /// <summary>
    /// Bot から組織のChatActorIdを取得する
    /// </summary>
    /// <param name="bot">Bot</param>
    /// <returns>ChatActorId</returns>
    /// <exception cref="InvalidOperationException">ChatActorが見つからない場合</exception>
    public static int GetChatActorId(this DB.Models.Bot bot)
    {
        return bot.ChatActors.FirstOrDefault()?.Id
            ?? throw new InvalidOperationException($"Bot {bot.Id} has no ChatActor loaded");
    }

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
        var chatActor = bot.GetChatActor()
            ?? throw new InvalidOperationException($"Bot {bot.Id} has no ChatActor loaded");

        return new
        {
            RoomId = room.Id,
            RoomType = room.Type.ToString(),
            Message = new
            {
                message.Id,
                SenderActorId = chatActor.Id,
                message.MessageType,
                message.Content,
                message.ReplyToMessageId,
                message.CreatedAt,
                Sender = new
                {
                    chatActor.Id,
                    ActorType = chatActor.ActorType.ToString(),
                    UserId = (int?)null,
                    BotId = bot.Id,
                    DisplayName = chatActor.DisplayName,
                    AvatarType = chatActor.AvatarType?.ToString()?.ToLowerInvariant(),
                    AvatarUrl = chatActor.AvatarUrl ?? bot.IconUrl,
                    IdentityIconUrl = chatActor.AvatarUrl ?? bot.IconUrl ?? "",
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