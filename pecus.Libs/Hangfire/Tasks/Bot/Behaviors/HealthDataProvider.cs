using Pecus.Libs.Statistics;

namespace Pecus.Libs.Hangfire.Tasks.Bot.Behaviors;

/// <summary>
/// 健康状態データを取得するプロバイダー
/// </summary>
public interface IHealthDataProvider
{
    /// <summary>
    /// ワークスペースの健康状態データを取得する
    /// </summary>
    Task<HealthData> GetWorkspaceHealthDataAsync(int workspaceId);

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
    public async Task<HealthData> GetWorkspaceHealthDataAsync(int workspaceId)
    {
        var oneWeekAgo = StatisticsDateHelper.GetDaysAgo(7);

        var taskStats = await _statisticsCollector.GetWorkspaceTaskStatisticsAsync(workspaceId);
        var memberCount = await _statisticsCollector.GetWorkspaceMemberCountAsync(workspaceId);
        var activityCount = await _statisticsCollector.GetWorkspaceActivityCountAsync(workspaceId, oneWeekAgo);
        var trend = await _statisticsCollector.GetWorkspaceTaskTrendAsync(workspaceId, 4);

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
        };
    }
}