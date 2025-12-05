namespace Pecus.Models.Responses.WorkspaceItemRelation;

/// <summary>
/// ワークスペースアイテム関連追加レスポンス
/// </summary>
public class AddWorkspaceItemRelationResponse
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
    /// 関連情報
    /// </summary>
    public WorkspaceItemRelationResponse? Relation { get; set; }
}