using Pecus.Libs.DB.Models.Enums;
using Pecus.Libs.Statistics;
using Pecus.Libs.Statistics.Models;

namespace Pecus.Libs.Hangfire.Tasks.Bot.Behaviors;

/// <summary>
/// 健康状態データを取得するプロバイダー
/// </summary>
public interface IHealthDataProvider
{
    /// <summary>
    /// ワークスペースの健康状態データを取得する
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="workspaceMode">ワークスペースモード（オプション、指定時はモードに応じた統計を含める）</param>
    Task<HealthData> GetWorkspaceHealthDataAsync(int workspaceId, WorkspaceMode? workspaceMode = null);

    /// <summary>
    /// 組織の健康状態データを取得する
    /// </summary>
    Task<HealthData> GetOrganizationHealthDataAsync(int organizationId);
}

/// <summary>
/// 健康状態データを取得するプロバイダー実装
/// IStatisticsCollector を使用して統一された計算ロジックでデータを取得
/// </summary>
public class HealthDataProvider : IHealthDataProvider
{
    private readonly IStatisticsCollector _statisticsCollector;

    /// <summary>
    /// HealthDataProvider のコンストラクタ
    /// </summary>
    public HealthDataProvider(IStatisticsCollector statisticsCollector)
    {
        _statisticsCollector = statisticsCollector;
    }

    /// <inheritdoc />
    public async Task<HealthData> GetWorkspaceHealthDataAsync(int workspaceId, WorkspaceMode? workspaceMode = null)
    {
        var oneWeekAgo = StatisticsDateHelper.GetDaysAgo(7);

        var taskStats = await _statisticsCollector.GetWorkspaceTaskStatisticsAsync(workspaceId);
        var memberCount = await _statisticsCollector.GetWorkspaceMemberCountAsync(workspaceId);
        var activityCount = await _statisticsCollector.GetWorkspaceActivityCountAsync(workspaceId, oneWeekAgo);
        var trend = await _statisticsCollector.GetWorkspaceTaskTrendAsync(workspaceId, 4);

        // ドキュメントモードの場合はドキュメント統計も取得
        ItemStatistics? documentStats = null;
        if (workspaceMode == WorkspaceMode.Document)
        {
            documentStats = await _statisticsCollector.GetWorkspaceItemStatisticsAsync(workspaceId);
        }

        return new HealthData
        {
            TotalMembers = memberCount,
            TotalTasks = taskStats.TotalCount,
            CompletedTasks = taskStats.CompletedCount,
            OverdueTasks = taskStats.OverdueCount,
            TasksCreatedThisWeek = taskStats.CreatedThisWeekCount,
            TasksCompletedThisWeek = taskStats.CompletedThisWeekCount,
            AverageTaskAgeDays = taskStats.AverageTaskAgeDays,
            ActivitiesThisWeek = activityCount,
            Trend = trend,
            DocumentStats = documentStats,
            WorkspaceMode = workspaceMode?.ToString(),
        };
    }

    /// <inheritdoc />
    public async Task<HealthData> GetOrganizationHealthDataAsync(int organizationId)
    {
        var oneWeekAgo = StatisticsDateHelper.GetDaysAgo(7);

        var taskStats = await _statisticsCollector.GetOrganizationTaskStatisticsAsync(organizationId);
        var memberCount = await _statisticsCollector.GetOrganizationMemberCountAsync(organizationId);
        var activityCount = await _statisticsCollector.GetOrganizationActivityCountAsync(organizationId, oneWeekAgo);
        var trend = await _statisticsCollector.GetOrganizationTaskTrendAsync(organizationId, 4);

        // 組織全体の場合もドキュメント統計を含める（バランス診断用）
        var documentStats = await _statisticsCollector.GetOrganizationItemStatisticsAsync(organizationId);

        return new HealthData
        {
            TotalMembers = memberCount,
            TotalTasks = taskStats.TotalCount,
            CompletedTasks = taskStats.CompletedCount,
            OverdueTasks = taskStats.OverdueCount,
            TasksCreatedThisWeek = taskStats.CreatedThisWeekCount,
            TasksCompletedThisWeek = taskStats.CompletedThisWeekCount,
            AverageTaskAgeDays = taskStats.AverageTaskAgeDays,
            ActivitiesThisWeek = activityCount,
            Trend = trend,
            DocumentStats = documentStats,
        };
    }
}