using Microsoft.EntityFrameworkCore;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Models.Responses.Dashboard;

namespace Pecus.Services;

/// <summary>
/// ダッシュボード統計サービス
/// 組織・ワークスペース・個人レベルの統計情報を提供
/// </summary>
public class DashboardStatisticsService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<DashboardStatisticsService> _logger;

    public DashboardStatisticsService(
        ApplicationDbContext context,
        ILogger<DashboardStatisticsService> logger
    )
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// 組織のダッシュボードサマリを取得
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <returns>ダッシュボードサマリ</returns>
    public async Task<DashboardSummaryResponse> GetOrganizationSummaryAsync(int organizationId)
    {
        var now = DateTimeOffset.UtcNow;
        var todayStart = new DateTimeOffset(now.Date, TimeSpan.Zero);
        var endOfWeek = GetEndOfWeek(todayStart);

        // 組織内のワークスペースID一覧を取得
        var workspaceIds = await _context.Workspaces
            .Where(w => w.OrganizationId == organizationId && w.IsActive)
            .Select(w => w.Id)
            .ToListAsync();

        // タスク統計
        var taskQuery = _context.WorkspaceTasks
            .Where(t => workspaceIds.Contains(t.WorkspaceId));

        var taskSummary = await GetTaskSummaryAsync(taskQuery, todayStart, endOfWeek);

        // アイテム統計
        var itemQuery = _context.WorkspaceItems
            .Where(i => workspaceIds.Contains(i.WorkspaceId));

        var itemSummary = await GetItemSummaryAsync(itemQuery);

        return new DashboardSummaryResponse
        {
            TaskSummary = taskSummary,
            ItemSummary = itemSummary,
        };
    }

    /// <summary>
    /// 組織の優先度別タスク数を取得
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <returns>優先度別タスク数</returns>
    public async Task<DashboardTasksByPriorityResponse> GetOrganizationTasksByPriorityAsync(int organizationId)
    {
        // 組織内のワークスペースID一覧を取得
        var workspaceIds = await _context.Workspaces
            .Where(w => w.OrganizationId == organizationId && w.IsActive)
            .Select(w => w.Id)
            .ToListAsync();

        // 進行中タスクの優先度別集計
        var priorityCounts = await _context.WorkspaceTasks
            .Where(t => workspaceIds.Contains(t.WorkspaceId) && !t.IsCompleted && !t.IsDiscarded)
            .GroupBy(t => t.Priority)
            .Select(g => new PriorityTaskCount
            {
                Priority = g.Key,
                Count = g.Count(),
            })
            .ToListAsync();

        // 全優先度を含めるように補完（存在しない優先度は0件で追加）
        var allPriorities = new List<TaskPriority?> { null, TaskPriority.Low, TaskPriority.Medium, TaskPriority.High, TaskPriority.Critical };
        foreach (var priority in allPriorities)
        {
            if (!priorityCounts.Any(p => p.Priority == priority))
            {
                priorityCounts.Add(new PriorityTaskCount { Priority = priority, Count = 0 });
            }
        }

        // 優先度順でソート（nullは最後、それ以外は優先度の値順）
        priorityCounts = priorityCounts
            .OrderBy(p => p.Priority == null ? int.MaxValue : (int)p.Priority)
            .ToList();

        return new DashboardTasksByPriorityResponse
        {
            Priorities = priorityCounts,
            TotalCount = priorityCounts.Sum(p => p.Count),
        };
    }

    /// <summary>
    /// ログインユーザーの個人サマリを取得
    /// </summary>
    /// <param name="userId">ユーザーID</param>
    /// <param name="organizationId">組織ID</param>
    /// <returns>個人サマリ</returns>
    public async Task<DashboardPersonalSummaryResponse> GetPersonalSummaryAsync(int userId, int organizationId)
    {
        var now = DateTimeOffset.UtcNow;
        var todayStart = new DateTimeOffset(now.Date, TimeSpan.Zero);
        var startOfWeek = GetStartOfWeek(todayStart);
        var endOfWeek = GetEndOfWeek(todayStart);

        // 組織内のワークスペースID一覧を取得
        var workspaceIds = await _context.Workspaces
            .Where(w => w.OrganizationId == organizationId && w.IsActive)
            .Select(w => w.Id)
            .ToListAsync();

        // ユーザーの担当タスク（組織内）
        var userTaskQuery = _context.WorkspaceTasks
            .Where(t => t.AssignedUserId == userId && workspaceIds.Contains(t.WorkspaceId));

        // 担当中（未完了・未破棄）
        var assignedCount = await userTaskQuery
            .CountAsync(t => !t.IsCompleted && !t.IsDiscarded);

        // 完了済み（全期間）
        var completedCount = await userTaskQuery
            .CountAsync(t => t.IsCompleted);

        // 期限切れ
        var overdueCount = await userTaskQuery
            .CountAsync(t => !t.IsCompleted && !t.IsDiscarded && t.DueDate < todayStart);

        // 今週期限
        var dueThisWeekCount = await userTaskQuery
            .CountAsync(t => !t.IsCompleted && !t.IsDiscarded && t.DueDate >= todayStart && t.DueDate <= endOfWeek);

        // 今週完了（CompletedAtベース）
        var completedThisWeekCount = await userTaskQuery
            .CountAsync(t => t.IsCompleted && t.CompletedAt != null && t.CompletedAt >= startOfWeek && t.CompletedAt <= endOfWeek);

        return new DashboardPersonalSummaryResponse
        {
            AssignedCount = assignedCount,
            CompletedCount = completedCount,
            OverdueCount = overdueCount,
            DueThisWeekCount = dueThisWeekCount,
            CompletedThisWeekCount = completedThisWeekCount,
        };
    }

    /// <summary>
    /// ワークスペース別統計を取得
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <returns>ワークスペース別統計</returns>
    public async Task<DashboardWorkspaceBreakdownResponse> GetWorkspaceBreakdownAsync(int organizationId)
    {
        var now = DateTimeOffset.UtcNow;
        var todayStart = new DateTimeOffset(now.Date, TimeSpan.Zero);

        // 組織内のアクティブなワークスペース
        var workspaces = await _context.Workspaces
            .Include(w => w.Genre)
            .Where(w => w.OrganizationId == organizationId && w.IsActive)
            .ToListAsync();

        var workspaceStatistics = new List<DashboardWorkspaceStatistics>();

        foreach (var workspace in workspaces)
        {
            // タスク統計
            var taskQuery = _context.WorkspaceTasks.Where(t => t.WorkspaceId == workspace.Id);
            var inProgressCount = await taskQuery.CountAsync(t => !t.IsCompleted && !t.IsDiscarded);
            var completedCount = await taskQuery.CountAsync(t => t.IsCompleted);
            var overdueCount = await taskQuery.CountAsync(t => !t.IsCompleted && !t.IsDiscarded && t.DueDate < todayStart);

            // アイテム数
            var itemCount = await _context.WorkspaceItems
                .CountAsync(i => i.WorkspaceId == workspace.Id && !i.IsArchived);

            // メンバー数
            var memberCount = await _context.WorkspaceUsers
                .CountAsync(wu => wu.WorkspaceId == workspace.Id);

            workspaceStatistics.Add(new DashboardWorkspaceStatistics
            {
                WorkspaceId = workspace.Id,
                WorkspaceCode = workspace.Code ?? string.Empty,
                WorkspaceName = workspace.Name,
                GenreIcon = workspace.Genre?.Icon,
                InProgressCount = inProgressCount,
                CompletedCount = completedCount,
                OverdueCount = overdueCount,
                ItemCount = itemCount,
                MemberCount = memberCount,
            });
        }

        // 進行中タスクが多い順でソート
        workspaceStatistics = workspaceStatistics
            .OrderByDescending(w => w.InProgressCount)
            .ToList();

        return new DashboardWorkspaceBreakdownResponse
        {
            Workspaces = workspaceStatistics,
        };
    }

    #region Private Helper Methods

    /// <summary>
    /// タスクサマリを集計
    /// </summary>
    private async Task<DashboardTaskSummary> GetTaskSummaryAsync(
        IQueryable<Pecus.Libs.DB.Models.WorkspaceTask> query,
        DateTimeOffset todayStart,
        DateTimeOffset endOfWeek)
    {
        var totalCount = await query.CountAsync();
        var inProgressCount = await query.CountAsync(t => !t.IsCompleted && !t.IsDiscarded);
        var completedCount = await query.CountAsync(t => t.IsCompleted);
        var discardedCount = await query.CountAsync(t => t.IsDiscarded);
        var overdueCount = await query.CountAsync(t => !t.IsCompleted && !t.IsDiscarded && t.DueDate < todayStart);
        var dueThisWeekCount = await query.CountAsync(t => !t.IsCompleted && !t.IsDiscarded && t.DueDate >= todayStart && t.DueDate <= endOfWeek);
        var unassignedCount = await query.CountAsync(t => t.AssignedUserId == 0 && !t.IsCompleted && !t.IsDiscarded);

        return new DashboardTaskSummary
        {
            TotalCount = totalCount,
            InProgressCount = inProgressCount,
            CompletedCount = completedCount,
            DiscardedCount = discardedCount,
            OverdueCount = overdueCount,
            DueThisWeekCount = dueThisWeekCount,
            UnassignedCount = unassignedCount,
        };
    }

    /// <summary>
    /// アイテムサマリを集計
    /// </summary>
    private async Task<DashboardItemSummary> GetItemSummaryAsync(
        IQueryable<Pecus.Libs.DB.Models.WorkspaceItem> query)
    {
        var totalCount = await query.CountAsync();
        var publishedCount = await query.CountAsync(i => !i.IsDraft && !i.IsArchived);
        var draftCount = await query.CountAsync(i => i.IsDraft);
        var archivedCount = await query.CountAsync(i => i.IsArchived);

        return new DashboardItemSummary
        {
            TotalCount = totalCount,
            PublishedCount = publishedCount,
            DraftCount = draftCount,
            ArchivedCount = archivedCount,
        };
    }

    /// <summary>
    /// 週の開始日（月曜日）を取得
    /// </summary>
    private static DateTimeOffset GetStartOfWeek(DateTimeOffset date)
    {
        var diff = (7 + (date.DayOfWeek - DayOfWeek.Monday)) % 7;
        return date.AddDays(-diff);
    }

    /// <summary>
    /// 週の終了日（日曜日の終わり）を取得
    /// </summary>
    private static DateTimeOffset GetEndOfWeek(DateTimeOffset date)
    {
        var startOfWeek = GetStartOfWeek(date);
        return startOfWeek.AddDays(7).AddTicks(-1);
    }

    /// <summary>
    /// ISO週番号を取得
    /// </summary>
    private static int GetIsoWeekNumber(DateTimeOffset date)
    {
        var cal = System.Globalization.CultureInfo.InvariantCulture.Calendar;
        return cal.GetWeekOfYear(date.DateTime, System.Globalization.CalendarWeekRule.FirstFourDayWeek, DayOfWeek.Monday);
    }

    #endregion

    #region Trend Methods

    /// <summary>
    /// 週次タスクトレンドを取得
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <param name="weeks">取得する週数（デフォルト8週）</param>
    /// <returns>週次タスクトレンド</returns>
    public async Task<DashboardTaskTrendResponse> GetTaskTrendAsync(int organizationId, int weeks = 8)
    {
        var now = DateTimeOffset.UtcNow;
        var todayStart = new DateTimeOffset(now.Date, TimeSpan.Zero);
        var currentWeekStart = GetStartOfWeek(todayStart);
        var startDate = currentWeekStart.AddDays(-7 * (weeks - 1));

        // 組織内のワークスペースID一覧を取得
        var workspaceIds = await _context.Workspaces
            .Where(w => w.OrganizationId == organizationId && w.IsActive)
            .Select(w => w.Id)
            .ToListAsync();

        // 期間内のタスクを取得
        var tasksInPeriod = await _context.WorkspaceTasks
            .Where(t => workspaceIds.Contains(t.WorkspaceId))
            .Where(t =>
                (t.CreatedAt >= startDate) ||
                (t.CompletedAt != null && t.CompletedAt >= startDate)
            )
            .Select(t => new { t.CreatedAt, t.CompletedAt })
            .ToListAsync();

        // 週ごとに集計
        var weeklyTrends = new List<WeeklyTaskTrend>();
        for (int i = 0; i < weeks; i++)
        {
            var weekStart = startDate.AddDays(7 * i);
            var weekEnd = weekStart.AddDays(7);

            var createdCount = tasksInPeriod.Count(t => t.CreatedAt >= weekStart && t.CreatedAt < weekEnd);
            var completedCount = tasksInPeriod.Count(t => t.CompletedAt != null && t.CompletedAt >= weekStart && t.CompletedAt < weekEnd);

            weeklyTrends.Add(new WeeklyTaskTrend
            {
                WeekStart = weekStart,
                WeekNumber = GetIsoWeekNumber(weekStart),
                Label = $"{weekStart:M/d}〜{weekStart.AddDays(6):M/d}",
                CreatedCount = createdCount,
                CompletedCount = completedCount,
            });
        }

        return new DashboardTaskTrendResponse
        {
            WeeklyTrends = weeklyTrends,
            StartDate = startDate,
            EndDate = currentWeekStart.AddDays(7).AddTicks(-1),
        };
    }

    #endregion
}
