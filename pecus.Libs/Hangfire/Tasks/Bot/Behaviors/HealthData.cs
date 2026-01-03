namespace Pecus.Libs.Hangfire.Tasks.Bot.Behaviors;

/// <summary>
/// 健康状態データ（匿名化済み統計情報）
/// </summary>
public record HealthData
{
    /// <summary>総メンバー数（ワークスペースメンバーまたは組織ユーザー）</summary>
    public int TotalMembers { get; init; }

    /// <summary>タスク総数</summary>
    public int TotalTasks { get; init; }

    /// <summary>完了タスク数</summary>
    public int CompletedTasks { get; init; }

    /// <summary>期限切れタスク数</summary>
    public int OverdueTasks { get; init; }

    /// <summary>今週作成されたタスク数</summary>
    public int TasksCreatedThisWeek { get; init; }

    /// <summary>今週完了したタスク数</summary>
    public int TasksCompletedThisWeek { get; init; }

    /// <summary>未完了タスクの平均滞留日数</summary>
    public double AverageTaskAgeDays { get; init; }

    /// <summary>直近7日間のアクティビティ数</summary>
    public int ActivitiesThisWeek { get; init; }

    /// <summary>完了率（0-100）</summary>
    public double CompletionRate => TotalTasks > 0
        ? Math.Round((double)CompletedTasks / TotalTasks * 100, 1)
        : 0;

    /// <summary>AI向けの要約テキストを生成</summary>
    public string ToSummary()
    {
        return $"""
            チーム人員:
            - 総メンバー数: {TotalMembers}人

            タスク状況:
            - 総数: {TotalTasks}件（完了: {CompletedTasks}件、完了率: {CompletionRate}%）
            - 期限切れ: {OverdueTasks}件
            - 今週の新規: {TasksCreatedThisWeek}件、今週の完了: {TasksCompletedThisWeek}件
            - 未完了タスクの平均滞留日数: {AverageTaskAgeDays:F1}日

            チーム活動:
            - 直近7日間のアクティビティ: {ActivitiesThisWeek}件
            """;
    }
}