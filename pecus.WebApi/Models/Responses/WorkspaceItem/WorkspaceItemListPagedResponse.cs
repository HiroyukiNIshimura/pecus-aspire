namespace Pecus.Models.Responses.WorkspaceItem;

/// <summary>
/// ワークスペースアイテム一覧ページングレスポンス
/// </summary>
public class WorkspaceItemListPagedResponse
{
    public int CurrentPage { get; set; }
    public int TotalPages { get; set; }
    public int TotalCount { get; set; }
    public List<WorkspaceItemListResponse> Data { get; set; } = [];
}