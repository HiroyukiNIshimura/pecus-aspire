using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;

namespace Pecus.Libs.Hangfire.Tasks.Bot.Utils;

/// <summary>
/// Bot タスクで使用するチャットメッセージ情報
/// ChatMessage から必要な情報を抽出したレスポンスクラス
/// </summary>
public class BotChatMessageInfo
{
    /// <summary>
    /// メッセージID
    /// </summary>
    public int Id { get; init; }

    /// <summary>
    /// メッセージ本文
    /// </summary>
    public string Content { get; init; } = string.Empty;

    /// <summary>
    /// 送信日時
    /// </summary>
    public DateTimeOffset CreatedAt { get; init; }

    /// <summary>
    /// 送信者が Bot かどうか
    /// </summary>
    public bool IsBot { get; init; }

    /// <summary>
    /// 送信者名（ユーザー名または Bot 名）
    /// </summary>
    public string UserName { get; init; } = string.Empty;

    /// <summary>
    /// 送信者アクターID
    /// </summary>
    public int? SenderActorId { get; init; }

    /// <summary>
    /// メッセージタイプ
    /// </summary>
    public ChatMessageType MessageType { get; init; }

    /// <summary>
    /// 返信先メッセージID
    /// </summary>
    public int? ReplyToMessageId { get; init; }

    /// <summary>
    /// ChatMessage から BotChatMessageInfo を生成する
    /// </summary>
    /// <param name="message">元のチャットメッセージ</param>
    /// <returns>BotChatMessageInfo インスタンス</returns>
    public static BotChatMessageInfo FromChatMessage(ChatMessage message)
    {
        var actor = message.SenderActor;
        var isBot = actor?.ActorType == ChatActorType.Bot;
        var userName = actor?.DisplayName ?? "Unknown";

        return new BotChatMessageInfo
        {
            Id = message.Id,
            Content = message.Content,
            CreatedAt = message.CreatedAt,
            IsBot = isBot,
            UserName = userName,
            SenderActorId = message.SenderActorId,
            MessageType = message.MessageType,
            ReplyToMessageId = message.ReplyToMessageId,
        };
    }
}