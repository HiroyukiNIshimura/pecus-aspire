using Pecus.Libs.DB.Models.Enums;
using Pecus.Libs.Statistics.Models;

namespace Pecus.Libs.Hangfire.Tasks.Bot.Behaviors;

/// <summary>
/// 健康状態データの基底型（匿名化済み統計情報）
/// </summary>
public abstract record HealthData
{
    /// <summary>総メンバー数（ワークスペースメンバーまたは組織ユーザー）</summary>
    public int TotalMembers { get; init; }

    /// <summary>直近7日間のアクティビティ数</summary>
    public int ActivitiesThisWeek { get; init; }

    /// <summary>ワークスペースモード（組織全体診断の場合は null）</summary>
    public WorkspaceMode? WorkspaceMode { get; init; }

    /// <summary>AI向けの要約テキストを生成</summary>
    public abstract string ToSummary();
}

/// <summary>
/// プロジェクト管理ワークスペースの健康状態データ
/// </summary>
public sealed record TaskWorkspaceHealthData : HealthData
{
    /// <summary>タスク統計</summary>
    public required TaskStatistics TaskStats { get; init; }

    /// <summary>週次トレンド（オプション）</summary>
    public TaskTrend? Trend { get; init; }

    /// <inheritdoc />
    public override string ToSummary()
    {
        var baseSummary = $"""
            チーム人員:
            - 総メンバー数: {TotalMembers}人

            タスク状況:
            - 総数: {TaskStats.TotalCount}件（完了: {TaskStats.CompletedCount}件、完了率: {TaskStats.CompletionRate}%）
            - 期限切れ: {TaskStats.OverdueCount}件
            - 今週の新規: {TaskStats.CreatedThisWeekCount}件、今週の完了: {TaskStats.CompletedThisWeekCount}件
            - 未完了タスクの平均滞留日数: {TaskStats.AverageTaskAgeDays:F1}日

            チーム活動:
            - 直近7日間のアクティビティ: {ActivitiesThisWeek}件
            """;

        if (Trend != null)
        {
            baseSummary += $"\n\n{Trend.ToSummary()}";
        }

        return baseSummary;
    }
}

/// <summary>
/// ドキュメント管理ワークスペースの健康状態データ
/// </summary>
public sealed record DocumentWorkspaceHealthData : HealthData
{
    /// <summary>ドキュメント統計</summary>
    public required ItemStatistics DocumentStats { get; init; }

    /// <inheritdoc />
    public override string ToSummary()
    {
        return $"""
            チーム人員:
            - 総メンバー数: {TotalMembers}人

            ドキュメント状況:
            - 総数: {DocumentStats.TotalCount}件（公開: {DocumentStats.PublishedCount}件、下書き: {DocumentStats.DraftCount}件）
            - 長期未更新（30日以上）: {DocumentStats.StaleCount}件
            - 今週の新規作成: {DocumentStats.CreatedThisWeekCount}件、今週の更新: {DocumentStats.UpdatedThisWeekCount}件
            - 公開記事の平均経過日数（最終更新から）: {DocumentStats.AverageItemAgeDays:F1}日
            - 直近30日間のユニーク編集者: {DocumentStats.UniqueContributorCount}人

            チーム活動:
            - 直近7日間のアクティビティ: {ActivitiesThisWeek}件
            """;
    }
}

/// <summary>
/// 組織全体の健康状態データ（タスク + ドキュメント）
/// </summary>
public sealed record OrganizationHealthData : HealthData
{
    /// <summary>タスク統計</summary>
    public required TaskStatistics TaskStats { get; init; }

    /// <summary>ドキュメント統計</summary>
    public required ItemStatistics DocumentStats { get; init; }

    /// <summary>週次トレンド（オプション）</summary>
    public TaskTrend? Trend { get; init; }

    /// <inheritdoc />
    public override string ToSummary()
    {
        var baseSummary = $"""
            チーム人員:
            - 総メンバー数: {TotalMembers}人

            タスク状況:
            - 総数: {TaskStats.TotalCount}件（完了: {TaskStats.CompletedCount}件、完了率: {TaskStats.CompletionRate}%）
            - 期限切れ: {TaskStats.OverdueCount}件
            - 今週の新規: {TaskStats.CreatedThisWeekCount}件、今週の完了: {TaskStats.CompletedThisWeekCount}件
            - 未完了タスクの平均滞留日数: {TaskStats.AverageTaskAgeDays:F1}日

            チーム活動:
            - 直近7日間のアクティビティ: {ActivitiesThisWeek}件

            ドキュメント状況:
            - 総数: {DocumentStats.TotalCount}件（公開: {DocumentStats.PublishedCount}件、下書き: {DocumentStats.DraftCount}件）
            - 長期未更新（30日以上）: {DocumentStats.StaleCount}件
            - 今週の新規作成: {DocumentStats.CreatedThisWeekCount}件、今週の更新: {DocumentStats.UpdatedThisWeekCount}件
            - 公開記事の平均経過日数（最終更新から）: {DocumentStats.AverageItemAgeDays:F1}日
            - 直近30日間のユニーク編集者: {DocumentStats.UniqueContributorCount}人
            """;

        if (Trend != null)
        {
            baseSummary += $"\n\n{Trend.ToSummary()}";
        }

        return baseSummary;
    }
}