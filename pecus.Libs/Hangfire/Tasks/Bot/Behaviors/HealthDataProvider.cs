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

        var totalMembers = await _context.WorkspaceUsers
            .Where(m => m.WorkspaceId == workspaceId)
            .CountAsync();

        var tasks = await _context.WorkspaceTasks
            .Where(t => t.WorkspaceId == workspaceId && !t.IsDiscarded)
            .Select(t => new
            {
                t.IsCompleted,
                t.DueDate,
                t.CreatedAt,
                t.CompletedAt,
            })
            .ToListAsync();

        var totalTasks = tasks.Count;
        var completedTasks = tasks.Count(t => t.IsCompleted);
        var overdueTasks = tasks.Count(t =>
            !t.IsCompleted &&
            t.DueDate < now);
        var tasksCreatedThisWeek = tasks.Count(t => t.CreatedAt >= oneWeekAgo);
        var tasksCompletedThisWeek = tasks.Count(t =>
            t.IsCompleted &&
            t.CompletedAt.HasValue &&
            t.CompletedAt.Value >= oneWeekAgo);

        var incompleteTasks = tasks.Where(t => !t.IsCompleted).ToList();
        var averageTaskAgeDays = incompleteTasks.Count > 0
            ? incompleteTasks.Average(t => (now - t.CreatedAt).TotalDays)
            : 0;

        var activeMembers = await _context.Activities
            .Where(a => a.WorkspaceId == workspaceId && a.CreatedAt >= oneWeekAgo)
            .Select(a => a.UserId)
            .Distinct()
            .CountAsync();

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
            ActiveMembersThisWeek = activeMembers,
            ActivitiesThisWeek = activitiesThisWeek,
        };
    }

    /// <inheritdoc />
    public async Task<HealthData> GetOrganizationHealthDataAsync(int organizationId)
    {
        var now = DateTimeOffset.UtcNow;
        var oneWeekAgo = now.AddDays(-7);

        var totalMembers = await _context.Users
            .Where(u => u.OrganizationId == organizationId && u.IsActive)
            .CountAsync();

        var tasks = await _context.WorkspaceTasks
            .Where(t => t.OrganizationId == organizationId && !t.IsDiscarded)
            .Select(t => new
            {
                t.IsCompleted,
                t.DueDate,
                t.CreatedAt,
                t.CompletedAt,
            })
            .ToListAsync();

        var totalTasks = tasks.Count;
        var completedTasks = tasks.Count(t => t.IsCompleted);
        var overdueTasks = tasks.Count(t =>
            !t.IsCompleted &&
            t.DueDate < now);
        var tasksCreatedThisWeek = tasks.Count(t => t.CreatedAt >= oneWeekAgo);
        var tasksCompletedThisWeek = tasks.Count(t =>
            t.IsCompleted &&
            t.CompletedAt.HasValue &&
            t.CompletedAt.Value >= oneWeekAgo);

        var incompleteTasks = tasks.Where(t => !t.IsCompleted).ToList();
        var averageTaskAgeDays = incompleteTasks.Count > 0
            ? incompleteTasks.Average(t => (now - t.CreatedAt).TotalDays)
            : 0;

        var activeMembers = await _context.Activities
            .Where(a => a.Workspace!.OrganizationId == organizationId && a.CreatedAt >= oneWeekAgo)
            .Select(a => a.UserId)
            .Distinct()
            .CountAsync();

        var activitiesThisWeek = await _context.Activities
            .Where(a => a.Workspace!.OrganizationId == organizationId && a.CreatedAt >= oneWeekAgo)
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
            ActiveMembersThisWeek = activeMembers,
            ActivitiesThisWeek = activitiesThisWeek,
        };
    }
}
