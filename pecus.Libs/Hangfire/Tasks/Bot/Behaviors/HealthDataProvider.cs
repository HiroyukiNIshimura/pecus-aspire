using Microsoft.EntityFrameworkCore;
using Pecus.Libs.DB;

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
/// </summary>
public class HealthDataProvider : IHealthDataProvider
{
    private readonly ApplicationDbContext _context;

    /// <summary>
    /// HealthDataProvider のコンストラクタ
    /// </summary>
    public HealthDataProvider(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <inheritdoc />
    public async Task<HealthData> GetWorkspaceHealthDataAsync(int workspaceId)
    {
        var now = DateTimeOffset.UtcNow;
        var oneWeekAgo = now.AddDays(-7);

        var baseQuery = _context.WorkspaceTasks
            .Where(t => t.WorkspaceId == workspaceId);

        var totalMembers = await _context.WorkspaceUsers
            .Where(m => m.WorkspaceId == workspaceId)
            .CountAsync();

        var totalTasks = await baseQuery.CountAsync();

        var completedTasks = await baseQuery
            .Where(t => t.IsCompleted)
            .CountAsync();

        var overdueTasks = await baseQuery
            .Where(t => !t.IsCompleted && !t.IsDiscarded && t.DueDate < now)
            .CountAsync();

        var tasksCreatedThisWeek = await baseQuery
            .Where(t => t.CreatedAt >= oneWeekAgo)
            .CountAsync();

        var tasksCompletedThisWeek = await baseQuery
            .Where(t => t.IsCompleted && t.CompletedAt.HasValue && t.CompletedAt.Value >= oneWeekAgo)
            .CountAsync();

        var incompleteTaskCreatedDates = await baseQuery
            .Where(t => !t.IsCompleted && !t.IsDiscarded)
            .Select(t => t.CreatedAt)
            .ToListAsync();

        var averageTaskAgeDays = incompleteTaskCreatedDates.Count > 0
            ? incompleteTaskCreatedDates.Average(createdAt => (now - createdAt).TotalDays)
            : 0;

        var activitiesThisWeek = await _context.Activities
            .Where(a => a.WorkspaceId == workspaceId && a.CreatedAt >= oneWeekAgo)
            .CountAsync();

        return new HealthData
        {
            TotalMembers = totalMembers,
            TotalTasks = totalTasks,
            CompletedTasks = completedTasks,
            OverdueTasks = overdueTasks,
            TasksCreatedThisWeek = tasksCreatedThisWeek,
            TasksCompletedThisWeek = tasksCompletedThisWeek,
            AverageTaskAgeDays = Math.Round(averageTaskAgeDays, 1),
            ActivitiesThisWeek = activitiesThisWeek,
        };
    }

    /// <inheritdoc />
    public async Task<HealthData> GetOrganizationHealthDataAsync(int organizationId)
    {
        var now = DateTimeOffset.UtcNow;
        var todayStart = new DateTimeOffset(now.Date, TimeSpan.Zero);
        var oneWeekAgo = now.AddDays(-7);

        // DashboardStatisticsServiceに合わせてアクティブなワークスペースのみを対象にする
        var activeWorkspaceIds = await _context.Workspaces
            .Where(w => w.OrganizationId == organizationId && w.IsActive)
            .Select(w => w.Id)
            .ToListAsync();

        var baseQuery = _context.WorkspaceTasks
            .Where(t => activeWorkspaceIds.Contains(t.WorkspaceId));

        var totalMembers = await _context.Users
            .Where(u => u.OrganizationId == organizationId && u.IsActive)
            .CountAsync();

        var totalTasks = await baseQuery.CountAsync();

        var completedTasks = await baseQuery
            .Where(t => t.IsCompleted)
            .CountAsync();

        var overdueTasks = await baseQuery
            .Where(t => !t.IsCompleted && !t.IsDiscarded && t.DueDate < todayStart)
            .CountAsync();

        var tasksCreatedThisWeek = await baseQuery
            .Where(t => t.CreatedAt >= oneWeekAgo)
            .CountAsync();

        var tasksCompletedThisWeek = await baseQuery
            .Where(t => t.IsCompleted && t.CompletedAt.HasValue && t.CompletedAt.Value >= oneWeekAgo)
            .CountAsync();

        var incompleteTaskCreatedDates = await baseQuery
            .Where(t => !t.IsCompleted && !t.IsDiscarded)
            .Select(t => t.CreatedAt)
            .ToListAsync();

        var averageTaskAgeDays = incompleteTaskCreatedDates.Count > 0
            ? incompleteTaskCreatedDates.Average(createdAt => (now - createdAt).TotalDays)
            : 0;

        var activitiesThisWeek = await _context.Activities
            .Where(a => activeWorkspaceIds.Contains(a.WorkspaceId) && a.CreatedAt >= oneWeekAgo)
            .CountAsync();

        return new HealthData
        {
            TotalMembers = totalMembers,
            TotalTasks = totalTasks,
            CompletedTasks = completedTasks,
            OverdueTasks = overdueTasks,
            TasksCreatedThisWeek = tasksCreatedThisWeek,
            TasksCompletedThisWeek = tasksCompletedThisWeek,
            AverageTaskAgeDays = Math.Round(averageTaskAgeDays, 1),
            ActivitiesThisWeek = activitiesThisWeek,
        };
    }
}
