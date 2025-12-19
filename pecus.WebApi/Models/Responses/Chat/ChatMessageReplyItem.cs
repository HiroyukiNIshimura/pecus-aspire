using Pecus.Libs.DB.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.Chat;

/// <summary>
/// 返信先メッセージ項目（簡易版）
/// </summary>
public class ChatMessageReplyItem
{
    /// <summary>
    /// メッセージID
    /// </summary>
    [Required]
    public required int Id { get; set; }

    /// <summary>
    /// 送信者ユーザーID
    /// </summary>
    public int? SenderUserId { get; set; }

    /// <summary>
    /// 送信者ユーザー名
    /// </summary>
    public string? SenderUsername { get; set; }

    /// <summary>
    /// メッセージタイプ
    /// </summary>
    [Required]
    public required ChatMessageType MessageType { get; set; }

    /// <summary>
    /// メッセージ内容（プレビュー用、切り詰め）
    /// </summary>
    [Required]
    public required string ContentPreview { get; set; }
}
