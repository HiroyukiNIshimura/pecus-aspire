using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.Dashboard;

/// <summary>
/// 個人ダッシュボード統計レスポンス
/// ログインユーザー自身のタスク状況を集計
/// </summary>
public class DashboardPersonalSummaryResponse
{
    /// <summary>
    /// 担当中タスク数（未完了・未破棄）
    /// </summary>
    [Required]
    public required int AssignedCount { get; set; }

    /// <summary>
    /// 完了タスク数（指定期間内）
    /// </summary>
    [Required]
    public required int CompletedCount { get; set; }

    /// <summary>
    /// 期限切れタスク数
    /// </summary>
    [Required]
    public required int OverdueCount { get; set; }

    /// <summary>
    /// 今週期限タスク数
    /// </summary>
    [Required]
    public required int DueThisWeekCount { get; set; }

    /// <summary>
    /// 今週完了したタスク数（ActivityベースではなくCompletedAtベース）
    /// </summary>
    [Required]
    public required int CompletedThisWeekCount { get; set; }
}