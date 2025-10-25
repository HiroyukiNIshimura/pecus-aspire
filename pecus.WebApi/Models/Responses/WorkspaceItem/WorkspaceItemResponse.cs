namespace Pecus.Models.Responses.WorkspaceItem;

/// <summary>
/// ワークスペースアイテム操作レスポンス
/// </summary>
public class WorkspaceItemResponse
{
    /// <summary>
    /// 成功フラグ
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// メッセージ
    /// </summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// ワークスペースアイテム情報
    /// </summary>
    public WorkspaceItemDetailResponse? WorkspaceItem { get; set; }
}
