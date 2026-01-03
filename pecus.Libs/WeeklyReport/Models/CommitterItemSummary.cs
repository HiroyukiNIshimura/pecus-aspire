namespace Pecus.Libs.WeeklyReport.Models;

/// <summary>
/// オーナー向け: 責任を持つアイテムのサマリ（WS内にネスト表示）
/// </summary>
public class CommitterItemSummary
{
    /// <summary>
    /// アイテムID
    /// </summary>
    public int ItemId { get; set; }

    /// <summary>
    /// アイテム名
    /// </summary>
    public string ItemName { get; set; } = string.Empty;

    /// <summary>
    /// 進捗率（0-100）
    /// </summary>
    public int ProgressPercent { get; set; }

    /// <summary>
    /// 全タスク数
    /// </summary>
    public int TotalTaskCount { get; set; }

    /// <summary>
    /// 完了タスク数
    /// </summary>
    public int CompletedTaskCount { get; set; }

    /// <summary>
    /// 残りタスク数
    /// </summary>
    public int RemainingTaskCount { get; set; }

    /// <summary>
    /// 期限切れタスク数
    /// </summary>
    public int OverdueCount { get; set; }

    /// <summary>
    /// 来週期限のタスク数
    /// </summary>
    public int DueNextWeekCount { get; set; }

    /// <summary>
    /// 全タスクが完了しているか
    /// </summary>
    public bool IsCompleted => TotalTaskCount > 0 && CompletedTaskCount == TotalTaskCount;
}