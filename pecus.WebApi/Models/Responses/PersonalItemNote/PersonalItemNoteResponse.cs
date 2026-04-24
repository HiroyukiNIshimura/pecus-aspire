namespace Pecus.Models.Responses.PersonalItemNote;

/// <summary>
/// 個人メモレスポンス
/// </summary>
public class PersonalItemNoteResponse : IConflictModel
{
    /// <summary>
    /// メモID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// ワークスペースアイテムID
    /// </summary>
    public int WorkspaceItemId { get; set; }

    /// <summary>
    /// メモ内容
    /// </summary>
    public string Content { get; set; } = string.Empty;

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTimeOffset CreatedAt { get; set; }

    /// <summary>
    /// 更新日時
    /// </summary>
    public DateTimeOffset UpdatedAt { get; set; }
}
