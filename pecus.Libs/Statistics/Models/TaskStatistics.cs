namespace Pecus.Libs.Statistics.Models;

/// <summary>
/// タスク統計データ
/// DashboardStatisticsService の GetTaskSummaryAsync を基準とした統一モデル
/// </summary>
public record TaskStatistics
{
    /// <summary>タスク総数</summary>
    public int TotalCount { get; init; }

    /// <summary>進行中タスク数（未完了・未破棄）</summary>
    public int InProgressCount { get; init; }

    /// <summary>完了タスク数</summary>
    public int CompletedCount { get; init; }

    /// <summary>破棄タスク数</summary>
    public int DiscardedCount { get; init; }

    /// <summary>期限切れタスク数（期限超過の未完了・未破棄タスク）</summary>
    public int OverdueCount { get; init; }

    /// <summary>今週期限タスク数（今週中に期限の未完了・未破棄タスク）</summary>
    public int DueThisWeekCount { get; init; }

    /// <summary>未アサインタスク数（担当者未設定の未完了・未破棄タスク）</summary>
    public int UnassignedCount { get; init; }

    /// <summary>今週作成されたタスク数（HealthData/WeeklyReport 互換）</summary>
    public int CreatedThisWeekCount { get; init; }

    /// <summary>今週完了したタスク数（HealthData/WeeklyReport 互換）</summary>
    public int CompletedThisWeekCount { get; init; }

    /// <summary>未完了タスクの平均滞留日数（HealthData 互換）</summary>
    public double AverageTaskAgeDays { get; init; }

    /// <summary>完了率（0-100）</summary>
    public double CompletionRate => TotalCount > 0
        ? Math.Round((double)CompletedCount / TotalCount * 100, 1)
        : 0;
}
