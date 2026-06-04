namespace Pecus.Libs.DB.Models;

/// <summary>
/// チャットメッセージのメンションエンティティ
/// </summary>
public class ChatMessageMention
{
    /// <summary>
    /// メンションID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// チャットメッセージID
    /// </summary>
    public int ChatMessageId { get; set; }

    /// <summary>
    /// チャットメッセージ
    /// </summary>
    public ChatMessage ChatMessage { get; set; } = null!;

    /// <summary>
    /// メンション対象アクターID
    /// </summary>
    public int MentionedActorId { get; set; }

    /// <summary>
    /// メンション対象アクター
    /// </summary>
    public ChatActor MentionedActor { get; set; } = null!;

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}