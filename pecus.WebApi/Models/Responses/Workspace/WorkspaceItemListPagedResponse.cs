namespace Pecus.Models.Responses.Workspace;

/// <summary>
/// ワークスペースアイテム一覧ページングレスポンス
/// </summary>
public class WorkspaceItemListPagedResponse
{
    /// <summary>
    /// 現在のページ
    /// </summary>
    public int CurrentPage { get; set; }

    /// <summary>
    /// 総ページ数
    /// </summary>
    public int TotalPages { get; set; }

    /// <summary>
    /// 総アイテム数
    /// </summary>
    public int TotalCount { get; set; }

    /// <summary>
    /// アイテムデータ
    /// </summary>
    public List<WorkspaceItemListResponse> Data { get; set; } = [];
}