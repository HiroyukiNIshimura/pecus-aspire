namespace Pecus.Libs.WeeklyReport.Models;

/// <summary>
/// 全員共通: 個人タスクサマリ
/// </summary>
public class PersonalTaskSummary
{
    /// <summary>
    /// 今週完了したタスク数
    /// </summary>
    public int CompletedCount { get; set; }

    /// <summary>
    /// 残りのタスク数（未完了かつ未破棄）
    /// </summary>
    public int RemainingCount { get; set; }

    /// <summary>
    /// 期限切れタスク数
    /// </summary>
    public int OverdueCount { get; set; }
}
