using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.Dashboard;

/// <summary>
/// タスクトレンドレスポンス
/// 週次のタスク作成/完了推移データ
/// </summary>
public class DashboardTaskTrendResponse
{
    /// <summary>
    /// 週次データのリスト
    /// </summary>
    [Required]
    public required List<WeeklyTaskTrend> WeeklyTrends { get; set; }

    /// <summary>
    /// 期間の開始日
    /// </summary>
    [Required]
    public required DateTimeOffset StartDate { get; set; }

    /// <summary>
    /// 期間の終了日
    /// </summary>
    [Required]
    public required DateTimeOffset EndDate { get; set; }
}

/// <summary>
/// 週ごとのタスクトレンドデータ
/// </summary>
public class WeeklyTaskTrend
{
    /// <summary>
    /// 週の開始日（月曜日）
    /// </summary>
    [Required]
    public required DateTimeOffset WeekStart { get; set; }

    /// <summary>
    /// 週番号（年間での週番号）
    /// </summary>
    [Required]
    public required int WeekNumber { get; set; }

    /// <summary>
    /// 表示用ラベル（例: "12/2〜12/8"）
    /// </summary>
    [Required]
    public required string Label { get; set; }

    /// <summary>
    /// その週に作成されたタスク数
    /// </summary>
    [Required]
    public required int CreatedCount { get; set; }

    /// <summary>
    /// その週に完了したタスク数
    /// </summary>
    [Required]
    public required int CompletedCount { get; set; }
}
