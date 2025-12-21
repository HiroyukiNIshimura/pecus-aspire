using Pecus.Libs.DB.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.Chat;

/// <summary>
/// メッセージ送信リクエスト
/// </summary>
public class SendMessageRequest
{
    /// <summary>
    /// メッセージ内容
    /// </summary>
    [Required(ErrorMessage = "メッセージ内容は必須です。")]
    [MaxLength(10000, ErrorMessage = "メッセージは10000文字以内で入力してください。")]
    public required string Content { get; set; }

    /// <summary>
    /// メッセージタイプ（デフォルト: Text）
    /// </summary>
    public ChatMessageType? MessageType { get; set; }

    /// <summary>
    /// 返信先メッセージID
    /// </summary>
    public int? ReplyToMessageId { get; set; }
}