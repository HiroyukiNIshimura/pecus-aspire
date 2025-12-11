using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.Activity;

/// <summary>
/// アクティビティ一覧取得リクエスト
/// </summary>
public class GetActivitiesRequest
{
    /// <summary>
    /// ページ番号（1から開始）
    /// </summary>
    [Range(1, int.MaxValue)]
    public int Page { get; set; } = 1;

    /// <summary>
    /// 開始日時（この日時以降のアクティビティを取得）
    /// </summary>
    public DateTimeOffset? StartDate { get; set; }

    /// <summary>
    /// 終了日時（この日時以前のアクティビティを取得）
    /// </summary>
    public DateTimeOffset? EndDate { get; set; }
}
