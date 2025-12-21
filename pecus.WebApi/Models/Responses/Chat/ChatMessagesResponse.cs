using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.Chat;

/// <summary>
/// メッセージ一覧レスポンス
/// </summary>
public class ChatMessagesResponse
{
    /// <summary>
    /// メッセージ一覧
    /// </summary>
    [Required]
    public required List<ChatMessageItem> Messages { get; set; }

    /// <summary>
    /// 次ページカーソル（null の場合は最後のページ）
    /// </summary>
    public int? NextCursor { get; set; }

    /// <summary>
    /// さらにメッセージがあるか
    /// </summary>
    public bool HasMore => NextCursor.HasValue;
}