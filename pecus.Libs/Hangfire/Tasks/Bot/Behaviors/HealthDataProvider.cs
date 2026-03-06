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
    /// プロジェクト管理ワークスペースの健康状態データを取得する
    /// </summary>
    Task<TaskWorkspaceHealthData> GetTaskWorkspaceHealthDataAsync(int workspaceId);

    /// <summary>
    /// ドキュメント管理ワークスペースの健康状態データを取得する
    /// </summary>
    Task<DocumentWorkspaceHealthData> GetDocumentWorkspaceHealthDataAsync(int workspaceId);

    /// <summary>
    /// 組織の健康状態データを取得する
    /// </summary>
    Task<OrganizationHealthData> GetOrganizationHealthDataAsync(int organizationId);
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
    public async Task<TaskWorkspaceHealthData> GetTaskWorkspaceHealthDataAsync(int workspaceId)
    {
        var oneWeekAgo = StatisticsDateHelper.GetDaysAgo(7);

        var taskStats = await _statisticsCollector.GetWorkspaceTaskStatisticsAsync(workspaceId);
        var memberCount = await _statisticsCollector.GetWorkspaceMemberCountAsync(workspaceId);
        var activityCount = await _statisticsCollector.GetWorkspaceActivityCountAsync(workspaceId, oneWeekAgo);
        var trend = await _statisticsCollector.GetWorkspaceTaskTrendAsync(workspaceId, 4);

        return new TaskWorkspaceHealthData
        {
            TotalMembers = memberCount,
            TaskStats = taskStats,
            ActivitiesThisWeek = activityCount,
            Trend = trend,
            WorkspaceMode = WorkspaceMode.Normal,
        };
    }

    /// <inheritdoc />
    public async Task<DocumentWorkspaceHealthData> GetDocumentWorkspaceHealthDataAsync(int workspaceId)
    {
        var oneWeekAgo = StatisticsDateHelper.GetDaysAgo(7);

        var documentStats = await _statisticsCollector.GetWorkspaceItemStatisticsAsync(workspaceId);
        var memberCount = await _statisticsCollector.GetWorkspaceMemberCountAsync(workspaceId);
        var activityCount = await _statisticsCollector.GetWorkspaceActivityCountAsync(workspaceId, oneWeekAgo);

        return new DocumentWorkspaceHealthData
        {
            TotalMembers = memberCount,
            DocumentStats = documentStats,
            ActivitiesThisWeek = activityCount,
            WorkspaceMode = WorkspaceMode.Document,
        };
    }

    /// <inheritdoc />
    public async Task<OrganizationHealthData> GetOrganizationHealthDataAsync(int organizationId)
    {
        var oneWeekAgo = StatisticsDateHelper.GetDaysAgo(7);

        var taskStats = await _statisticsCollector.GetOrganizationTaskStatisticsAsync(organizationId);
        var memberCount = await _statisticsCollector.GetOrganizationMemberCountAsync(organizationId);
        var activityCount = await _statisticsCollector.GetOrganizationActivityCountAsync(organizationId, oneWeekAgo);
        var trend = await _statisticsCollector.GetOrganizationTaskTrendAsync(organizationId, 4);

        // 組織全体の場合もドキュメント統計を含める（バランス診断用）
        var documentStats = await _statisticsCollector.GetOrganizationItemStatisticsAsync(organizationId);

        return new OrganizationHealthData
        {
            TotalMembers = memberCount,
            TaskStats = taskStats,
            ActivitiesThisWeek = activityCount,
            Trend = trend,
            DocumentStats = documentStats,
        };
    }
}