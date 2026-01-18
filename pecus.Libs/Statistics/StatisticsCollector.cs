using Microsoft.EntityFrameworkCore;
using Pecus.Libs.DB;
using Pecus.Libs.Statistics.Models;

namespace Pecus.Libs.Statistics;

/// <summary>
/// 統計データ収集サービスの実装
/// DashboardStatisticsService の実装を基準とし、
/// HealthDataProvider / WeeklyReportDataCollector と統一された計算ロジックを提供
/// </summary>
public class StatisticsCollector : IStatisticsCollector
{
    private readonly ApplicationDbContext _context;

    /// <summary>
    /// StatisticsCollector のコンストラクタ
    /// </summary>
    /// <param name="context">DB コンテキスト</param>
    public StatisticsCollector(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <inheritdoc />
    public async Task<List<int>> GetActiveWorkspaceIdsAsync(
        int organizationId,
        CancellationToken cancellationToken = default)
    {
        return await _context.Workspaces
            .Where(w => w.OrganizationId == organizationId && w.IsActive)
            .Select(w => w.Id)
            .ToListAsync(cancellationToken);
    }

    /// <inheritdoc />
    public async Task<TaskStatistics> GetOrganizationTaskStatisticsAsync(
        int organizationId,
        CancellationToken cancellationToken = default)
    {
        var workspaceIds = await GetActiveWorkspaceIdsAsync(organizationId, cancellationToken);

        var query = _context.WorkspaceTasks
            .Where(t => workspaceIds.Contains(t.WorkspaceId));

        return await GetTaskStatisticsFromQueryAsync(query, cancellationToken);
    }

    /// <inheritdoc />
    public async Task<TaskStatistics> GetWorkspaceTaskStatisticsAsync(
        int workspaceId,
        CancellationToken cancellationToken = default)
    {
        var query = _context.WorkspaceTasks
            .Where(t => t.WorkspaceId == workspaceId);

        return await GetTaskStatisticsFromQueryAsync(query, cancellationToken);
    }

    /// <inheritdoc />
    public async Task<TaskStatistics> GetUserTaskStatisticsAsync(
        int organizationId,
        int userId,
        CancellationToken cancellationToken = default)
    {
        var workspaceIds = await GetActiveWorkspaceIdsAsync(organizationId, cancellationToken);

        var query = _context.WorkspaceTasks
            .Where(t => t.AssignedUserId == userId && workspaceIds.Contains(t.WorkspaceId));

        return await GetTaskStatisticsFromQueryAsync(query, cancellationToken);
    }

    /// <inheritdoc />
    public async Task<ItemStatistics> GetOrganizationItemStatisticsAsync(
        int organizationId,
        CancellationToken cancellationToken = default)
    {
        var workspaceIds = await GetActiveWorkspaceIdsAsync(organizationId, cancellationToken);

        var query = _context.WorkspaceItems
            .Where(i => workspaceIds.Contains(i.WorkspaceId));

        return await GetItemStatisticsFromQueryAsync(query, cancellationToken);
    }

    /// <inheritdoc />
    public async Task<ItemStatistics> GetWorkspaceItemStatisticsAsync(
        int workspaceId,
        CancellationToken cancellationToken = default)
    {
        var query = _context.WorkspaceItems
            .Where(i => i.WorkspaceId == workspaceId);

        return await GetItemStatisticsFromQueryAsync(query, cancellationToken);
    }

    /// <inheritdoc />
    public async Task<int> GetOrganizationMemberCountAsync(
        int organizationId,
        CancellationToken cancellationToken = default)
    {
        return await _context.Users
            .Where(u => u.OrganizationId == organizationId && u.IsActive)
            .CountAsync(cancellationToken);
    }

    /// <inheritdoc />
    public async Task<int> GetWorkspaceMemberCountAsync(
        int workspaceId,
        CancellationToken cancellationToken = default)
    {
        return await _context.WorkspaceUsers
            .Where(wu => wu.WorkspaceId == workspaceId)
            .CountAsync(cancellationToken);
    }

    /// <inheritdoc />
    public async Task<int> GetOrganizationActivityCountAsync(
        int organizationId,
        DateTimeOffset since,
        CancellationToken cancellationToken = default)
    {
        var workspaceIds = await GetActiveWorkspaceIdsAsync(organizationId, cancellationToken);

        return await _context.Activities
            .Where(a => workspaceIds.Contains(a.WorkspaceId) && a.CreatedAt >= since)
            .CountAsync(cancellationToken);
    }

    /// <inheritdoc />
    public async Task<int> GetWorkspaceActivityCountAsync(
        int workspaceId,
        DateTimeOffset since,
        CancellationToken cancellationToken = default)
    {
        return await _context.Activities
            .Where(a => a.WorkspaceId == workspaceId && a.CreatedAt >= since)
            .CountAsync(cancellationToken);
    }

    /// <summary>
    /// クエリからタスク統計を集計
    /// </summary>
    private async Task<TaskStatistics> GetTaskStatisticsFromQueryAsync(
        IQueryable<DB.Models.WorkspaceTask> query,
        CancellationToken cancellationToken)
    {
        var todayStart = StatisticsDateHelper.GetTodayStart();
        var weekStart = StatisticsDateHelper.GetThisWeekStart();
        var weekEnd = StatisticsDateHelper.GetThisWeekEnd();
        var oneWeekAgo = StatisticsDateHelper.GetDaysAgo(7);
        var now = DateTimeOffset.UtcNow;

        var totalCount = await query.CountAsync(cancellationToken);
        var inProgressCount = await query
            .CountAsync(t => !t.IsCompleted && !t.IsDiscarded, cancellationToken);
        var completedCount = await query
            .CountAsync(t => t.IsCompleted, cancellationToken);
        var discardedCount = await query
            .CountAsync(t => t.IsDiscarded, cancellationToken);
        var overdueCount = await query
            .CountAsync(t => !t.IsCompleted && !t.IsDiscarded && t.DueDate < todayStart, cancellationToken);
        var dueThisWeekCount = await query
            .CountAsync(t => !t.IsCompleted && !t.IsDiscarded && t.DueDate >= todayStart && t.DueDate <= weekEnd, cancellationToken);
        var unassignedCount = await query
            .CountAsync(t => t.AssignedUserId == 0 && !t.IsCompleted && !t.IsDiscarded, cancellationToken);
        var createdThisWeekCount = await query
            .CountAsync(t => t.CreatedAt >= oneWeekAgo, cancellationToken);
        var completedThisWeekCount = await query
            .CountAsync(t => t.IsCompleted && t.CompletedAt != null && t.CompletedAt >= weekStart && t.CompletedAt <= weekEnd, cancellationToken);

        var incompleteTaskCreatedDates = await query
            .Where(t => !t.IsCompleted && !t.IsDiscarded)
            .Select(t => t.CreatedAt)
            .ToListAsync(cancellationToken);

        var averageTaskAgeDays = incompleteTaskCreatedDates.Count > 0
            ? Math.Round(incompleteTaskCreatedDates.Average(createdAt => (now - createdAt).TotalDays), 1)
            : 0;

        return new TaskStatistics
        {
            TotalCount = totalCount,
            InProgressCount = inProgressCount,
            CompletedCount = completedCount,
            DiscardedCount = discardedCount,
            OverdueCount = overdueCount,
            DueThisWeekCount = dueThisWeekCount,
            UnassignedCount = unassignedCount,
            CreatedThisWeekCount = createdThisWeekCount,
            CompletedThisWeekCount = completedThisWeekCount,
            AverageTaskAgeDays = averageTaskAgeDays,
        };
    }

    /// <summary>
    /// クエリからアイテム統計を集計
    /// </summary>
    private async Task<ItemStatistics> GetItemStatisticsFromQueryAsync(
        IQueryable<DB.Models.WorkspaceItem> query,
        CancellationToken cancellationToken)
    {
        var totalCount = await query.CountAsync(cancellationToken);
        var publishedCount = await query
            .CountAsync(i => !i.IsDraft && !i.IsArchived, cancellationToken);
        var draftCount = await query
            .CountAsync(i => i.IsDraft, cancellationToken);
        var archivedCount = await query
            .CountAsync(i => i.IsArchived, cancellationToken);

        return new ItemStatistics
        {
            TotalCount = totalCount,
            PublishedCount = publishedCount,
            DraftCount = draftCount,
            ArchivedCount = archivedCount,
        };
    }

    /// <inheritdoc />
    public async Task<TaskTrend> GetOrganizationTaskTrendAsync(
        int organizationId,
        int weeks = 4,
        CancellationToken cancellationToken = default)
    {
        var workspaceIds = await GetActiveWorkspaceIdsAsync(organizationId, cancellationToken);

        var query = _context.WorkspaceTasks
            .Where(t => workspaceIds.Contains(t.WorkspaceId));

        return await GetTaskTrendFromQueryAsync(query, weeks, cancellationToken);
    }

    /// <inheritdoc />
    public async Task<TaskTrend> GetWorkspaceTaskTrendAsync(
        int workspaceId,
        int weeks = 4,
        CancellationToken cancellationToken = default)
    {
        var query = _context.WorkspaceTasks
            .Where(t => t.WorkspaceId == workspaceId);

        return await GetTaskTrendFromQueryAsync(query, weeks, cancellationToken);
    }

    /// <summary>
    /// クエリから週次トレンドを集計
    /// </summary>
    private async Task<TaskTrend> GetTaskTrendFromQueryAsync(
        IQueryable<DB.Models.WorkspaceTask> query,
        int weeks,
        CancellationToken cancellationToken)
    {
        var todayStart = StatisticsDateHelper.GetTodayStart();
        var currentWeekStart = StatisticsDateHelper.GetStartOfWeek(todayStart);
        var startDate = currentWeekStart.AddDays(-7 * (weeks - 1));

        // 期間内のタスクを取得
        var tasksInPeriod = await query
            .Where(t =>
                t.CreatedAt >= startDate ||
                (t.CompletedAt != null && t.CompletedAt >= startDate))
            .Select(t => new { t.CreatedAt, t.CompletedAt })
            .ToListAsync(cancellationToken);

        // 週ごとに集計
        var weeklyTrends = new List<WeeklyTrend>();
        for (int i = 0; i < weeks; i++)
        {
            var weekStart = startDate.AddDays(7 * i);
            var weekEnd = weekStart.AddDays(7);

            var createdCount = tasksInPeriod.Count(t =>
                t.CreatedAt >= weekStart && t.CreatedAt < weekEnd);
            var completedCount = tasksInPeriod.Count(t =>
                t.CompletedAt != null && t.CompletedAt >= weekStart && t.CompletedAt < weekEnd);

            weeklyTrends.Add(new WeeklyTrend
            {
                WeekStart = weekStart,
                Label = $"{weekStart:M/d}〜{weekStart.AddDays(6):M/d}",
                CreatedCount = createdCount,
                CompletedCount = completedCount,
            });
        }

        return new TaskTrend { Weeks = weeklyTrends };
    }
}