namespace Pecus.Models.Responses.WorkspaceItemRelation;

/// <summary>
/// ワークスペースアイテム関連一覧レスポンス
/// </summary>
public class WorkspaceItemRelationsResponse
{
    /// <summary>
    /// 関連元としての関連一覧（このアイテムから他へ）
    /// </summary>
    public List<WorkspaceItemRelationResponse> RelationsFrom { get; set; } = new();

    /// <summary>
    /// 関連先としての関連一覧（他からこのアイテムへ）
    /// </summary>
    public List<WorkspaceItemRelationResponse> RelationsTo { get; set; } = new();

    /// <summary>
    /// 全関連数
    /// </summary>
    public int TotalCount { get; set; }
}