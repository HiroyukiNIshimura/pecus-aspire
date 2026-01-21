using Pecus.Libs.DB.Models.Enums;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Pecus.Models.Responses.Chat;

/// <summary>
/// チャットメッセージ項目
/// </summary>
public class ChatMessageItem
{
    /// <summary>
    /// メッセージID
    /// </summary>
    [Required]
    public required int Id { get; set; }

    /// <summary>
    /// 送信者ユーザーID（AI/System メッセージの場合は null）
    /// </summary>
    public int? SenderUserId { get; set; }

    /// <summary>
    /// 送信者情報（AI/System メッセージの場合は null）
    /// </summary>
    public UserIdentityResponse? Sender { get; set; }

    /// <summary>
    /// メッセージタイプ
    /// </summary>
    [Required]
    [JsonConverter(typeof(JsonStringEnumConverter<ChatMessageType>))]
    public required ChatMessageType MessageType { get; set; }

    /// <summary>
    /// メッセージ内容
    /// </summary>
    [Required]
    public required string Content { get; set; }

    /// <summary>
    /// 返信先メッセージID
    /// </summary>
    public int? ReplyToMessageId { get; set; }

    /// <summary>
    /// 返信先メッセージ（簡易情報）
    /// </summary>
    public ChatMessageReplyItem? ReplyTo { get; set; }

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTimeOffset CreatedAt { get; set; }
}