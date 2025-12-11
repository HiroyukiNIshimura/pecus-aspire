namespace Pecus.Models.Responses.Activity;

/// <summary>
/// アクティビティ一覧レスポンス
/// </summary>
public class ActivitiesResponse
{
    /// <summary>
    /// アクティビティ一覧
    /// </summary>
    public List<ActivityResponse> Activities { get; set; } = [];

    /// <summary>
    /// 総件数
    /// </summary>
    public int TotalCount { get; set; }

    /// <summary>
    /// 現在のページ番号
    /// </summary>
    public int Page { get; set; }

    /// <summary>
    /// ページサイズ
    /// </summary>
    public int PageSize { get; set; }

    /// <summary>
    /// 総ページ数
    /// </summary>
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
}
