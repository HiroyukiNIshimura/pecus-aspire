using Pecus.Libs.DB.Models.Enums;

namespace Pecus.Libs.DB.Models;

/// <summary>
/// チャットメッセージエンティティ
/// </summary>
public class ChatMessage
{
    /// <summary>
    /// メッセージID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// チャットルームID
    /// </summary>
    public int ChatRoomId { get; set; }

    /// <summary>
    /// チャットルーム
    /// </summary>
    public ChatRoom ChatRoom { get; set; } = null!;

    /// <summary>
    /// 送信者ユーザーID
    /// AI からのメッセージの場合は null（MessageType = Ai と併用）
    /// </summary>
    public int? SenderUserId { get; set; }

    /// <summary>
    /// 送信者ユーザー
    /// </summary>
    public User? SenderUser { get; set; }

    /// <summary>
    /// メッセージタイプ
    /// </summary>
    public ChatMessageType MessageType { get; set; } = ChatMessageType.Text;

    /// <summary>
    /// メッセージ本文（Lexical JSON または プレーンテキスト）
    /// </summary>
    public string Content { get; set; } = string.Empty;

    /// <summary>
    /// 送信日時
    /// </summary>
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    /// <summary>
    /// 返信先メッセージID（スレッド返信の場合）
    /// </summary>
    public int? ReplyToMessageId { get; set; }

    /// <summary>
    /// 返信先メッセージ
    /// </summary>
    public ChatMessage? ReplyToMessage { get; set; }
}
