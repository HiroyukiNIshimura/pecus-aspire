namespace Pecus.Libs.AI.Models;

/// <summary>
/// 会話内のメッセージを表す
/// </summary>
public class ConversationMessage
{
    /// <summary>
    /// 発言者のID
    /// </summary>
    public required string SenderId { get; set; }

    /// <summary>
    /// 発言者の名前（表示用）
    /// </summary>
    public required string SenderName { get; set; }

    /// <summary>
    /// 発言者がボットかどうか
    /// </summary>
    public bool IsBot { get; set; }

    /// <summary>
    /// メッセージ本文
    /// </summary>
    public required string Content { get; set; }
}