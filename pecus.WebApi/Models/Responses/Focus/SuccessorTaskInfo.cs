namespace Pecus.Models.Responses.Focus;

/// <summary>
/// 後続タスク情報（先頭1件）
/// </summary>
public class SuccessorTaskInfo
{
    /// <summary>
    /// タスクID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// タスク内容
    /// </summary>
    public string Content { get; set; } = string.Empty;

    /// <summary>
    /// ワークスペースアイテムコード（例: "PROJ-42"）
    /// </summary>
    public string? WorkspaceItemCode { get; set; }
}
