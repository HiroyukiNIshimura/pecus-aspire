using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.Activity;

/// <summary>
/// マイアクティビティ一覧取得リクエスト
/// </summary>
public class GetMyActivitiesRequest
{
    /// <summary>
    /// ページ番号（1から開始）
    /// </summary>
    [Range(1, int.MaxValue)]
    public int Page { get; set; } = 1;

    /// <summary>
    /// 期間フィルタ（省略時は全期間）
    /// </summary>
    public ActivityPeriod? Period { get; set; }
}

/// <summary>
/// アクティビティの期間フィルタ
/// </summary>
public enum ActivityPeriod
{
    /// <summary>今日</summary>
    Today,

    /// <summary>昨日</summary>
    Yesterday,

    /// <summary>今週</summary>
    ThisWeek,

    /// <summary>先週</summary>
    LastWeek,

    /// <summary>今月</summary>
    ThisMonth,

    /// <summary>先月</summary>
    LastMonth
}