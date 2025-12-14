using Microsoft.EntityFrameworkCore;
using Pecus.Libs;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Models.Responses.Dashboard;

namespace Pecus.Services;

/// <summary>
/// ホットアイテム・ホットワークスペースの集計期間
/// </summary>
public enum HotPeriod
{
    /// <summary>
    /// 直近24時間
    /// </summary>
    Last24Hours,

    /// <summary>
    /// 直近1週間
    /// </summary>
    Last1Week,
}

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

    #region Hot Items / Hot Workspaces Methods

    /// <summary>
    /// ホットアイテム（直近でアクティビティが多いアイテム）を取得
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <param name="userId">現在のユーザーID（アクセス権チェック用）</param>
    /// <param name="period">集計期間</param>
    /// <param name="limit">取得件数（デフォルト10件）</param>
    /// <returns>ホットアイテムランキング</returns>
    public async Task<DashboardHotItemsResponse> GetHotItemsAsync(int organizationId, int userId, HotPeriod period, int limit = 10)
    {
        var since = GetPeriodStartDate(period);
        var periodString = period == HotPeriod.Last24Hours ? "24h" : "1week";

        // 組織内のワークスペースID一覧を取得
        var workspaceIds = await _context.Workspaces
            .Where(w => w.OrganizationId == organizationId && w.IsActive)
            .Select(w => w.Id)
            .ToListAsync();

        // ユーザーがアクセス可能なワークスペースID一覧を取得
        var accessibleWorkspaceIds = await _context.WorkspaceUsers
            .Where(wu => wu.UserId == userId && workspaceIds.Contains(wu.WorkspaceId))
            .Select(wu => wu.WorkspaceId)
            .ToListAsync();

        // Activity を ItemId で GROUP BY し、上位N件を取得
        var hotItemStats = await _context.Activities
            .Where(a => workspaceIds.Contains(a.WorkspaceId) && a.CreatedAt >= since)
            .GroupBy(a => a.ItemId)
            .Select(g => new
            {
                ItemId = g.Key,
                ActivityCount = g.Count(),
                LastActivityAt = g.Max(a => a.CreatedAt),
            })
            .OrderByDescending(x => x.ActivityCount)
            .Take(limit)
            .ToListAsync();

        if (hotItemStats.Count == 0)
        {
            return new DashboardHotItemsResponse
            {
                Period = periodString,
                Items = [],
            };
        }

        // アイテム詳細とワークスペース情報を取得
        var itemIds = hotItemStats.Select(x => x.ItemId).ToList();
        var items = await _context.WorkspaceItems
            .Include(i => i.Workspace)
                .ThenInclude(w => w!.Genre)
            .Where(i => itemIds.Contains(i.Id))
            .ToListAsync();

        // 各アイテムの最終アクティビティを取得（ユーザー情報付き）
        var lastActivities = await _context.Activities
            .Include(a => a.User)
            .Where(a => itemIds.Contains(a.ItemId) && a.CreatedAt >= since)
            .GroupBy(a => a.ItemId)
            .Select(g => g.OrderByDescending(a => a.CreatedAt).First())
            .ToListAsync();

        // 結合してレスポンス作成
        var hotItems = hotItemStats
            .Select(stat =>
            {
                var item = items.FirstOrDefault(i => i.Id == stat.ItemId);
                if (item == null) return null;

                var lastActivity = lastActivities.FirstOrDefault(a => a.ItemId == stat.ItemId);

                return new HotItemEntry
                {
                    ItemId = item.Id,
                    ItemCode = item.Code ?? string.Empty,
                    ItemSubject = item.Subject ?? "(無題)",
                    WorkspaceId = item.WorkspaceId,
                    WorkspaceCode = item.Workspace?.Code ?? string.Empty,
                    WorkspaceName = item.Workspace?.Name ?? string.Empty,
                    GenreIcon = item.Workspace?.Genre?.Icon,
                    ActivityCount = stat.ActivityCount,
                    LastActivityAt = stat.LastActivityAt,
                    LastActorId = lastActivity?.UserId,
                    LastActorName = lastActivity?.User?.Username,
                    LastActorAvatar = lastActivity?.User != null
                        ? IdentityIconHelper.GetIdentityIconUrl(
                            lastActivity.User.AvatarType,
                            lastActivity.User.Id,
                            lastActivity.User.Username,
                            lastActivity.User.Email,
                            lastActivity.User.UserAvatarPath)
                        : null,
                    LastActionLabel = lastActivity != null ? GetActionLabel(lastActivity.ActionType) : null,
                    CanAccess = accessibleWorkspaceIds.Contains(item.WorkspaceId),
                };
            })
            .Where(x => x != null)
            .Cast<HotItemEntry>()
            .ToList();

        return new DashboardHotItemsResponse
        {
            Period = periodString,
            Items = hotItems,
        };
    }

    /// <summary>
    /// アクションタイプを日本語ラベルに変換
    /// </summary>
    private static string GetActionLabel(ActivityActionType actionType)
    {
        return actionType switch
        {
            ActivityActionType.Created => "作成",
            ActivityActionType.SubjectUpdated => "件名を編集",
            ActivityActionType.BodyUpdated => "本文を編集",
            ActivityActionType.FileAdded => "ファイル追加",
            ActivityActionType.FileRemoved => "ファイル削除",
            ActivityActionType.AssigneeChanged => "担当者変更",
            ActivityActionType.RelationAdded => "関連追加",
            ActivityActionType.RelationRemoved => "関連削除",
            ActivityActionType.ArchivedChanged => "アーカイブ変更",
            ActivityActionType.DraftChanged => "下書き変更",
            ActivityActionType.CommitterChanged => "コミッター変更",
            ActivityActionType.PriorityChanged => "優先度変更",
            ActivityActionType.DueDateChanged => "期限変更",
            ActivityActionType.TaskAdded => "タスク追加",
            ActivityActionType.TaskCompleted => "タスク完了",
            ActivityActionType.TaskDiscarded => "タスク破棄",
            _ => "更新",
        };
    }

    /// <summary>
    /// ホットワークスペース（タスク関連アクティビティが多いワークスペース）を取得
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <param name="period">集計期間</param>
    /// <param name="limit">取得件数（デフォルト10件）</param>
    /// <returns>ホットワークスペースランキング</returns>
    public async Task<DashboardHotWorkspacesResponse> GetHotWorkspacesAsync(int organizationId, HotPeriod period, int limit = 10)
    {
        var since = GetPeriodStartDate(period);
        var periodString = period == HotPeriod.Last24Hours ? "24h" : "1week";

        // タスク関連の ActionType
        var taskActionTypes = new[] { ActivityActionType.TaskAdded, ActivityActionType.TaskCompleted };

        // 組織内のワークスペースID一覧を取得
        var workspaceIds = await _context.Workspaces
            .Where(w => w.OrganizationId == organizationId && w.IsActive)
            .Select(w => w.Id)
            .ToListAsync();

        // Activity を WorkspaceId + ActionType で GROUP BY
        var hotWorkspaceStats = await _context.Activities
            .Where(a => workspaceIds.Contains(a.WorkspaceId)
                && a.CreatedAt >= since
                && taskActionTypes.Contains(a.ActionType))
            .GroupBy(a => new { a.WorkspaceId, a.ActionType })
            .Select(g => new
            {
                g.Key.WorkspaceId,
                g.Key.ActionType,
                Count = g.Count(),
            })
            .ToListAsync();

        // ワークスペース単位で集計
        var aggregated = hotWorkspaceStats
            .GroupBy(x => x.WorkspaceId)
            .Select(g => new
            {
                WorkspaceId = g.Key,
                TaskAddedCount = g.Where(x => x.ActionType == ActivityActionType.TaskAdded).Sum(x => x.Count),
                TaskCompletedCount = g.Where(x => x.ActionType == ActivityActionType.TaskCompleted).Sum(x => x.Count),
            })
            .Select(x => new
            {
                x.WorkspaceId,
                x.TaskAddedCount,
                x.TaskCompletedCount,
                TotalTaskActivityCount = x.TaskAddedCount + x.TaskCompletedCount,
            })
            .OrderByDescending(x => x.TotalTaskActivityCount)
            .Take(limit)
            .ToList();

        if (aggregated.Count == 0)
        {
            return new DashboardHotWorkspacesResponse
            {
                Period = periodString,
                Workspaces = [],
            };
        }

        // ワークスペース情報を取得
        var wsIds = aggregated.Select(x => x.WorkspaceId).ToList();
        var workspaces = await _context.Workspaces
            .Include(w => w.Genre)
            .Where(w => wsIds.Contains(w.Id))
            .ToListAsync();

        // 結合してレスポンス作成
        var hotWorkspaces = aggregated
            .Select(stat =>
            {
                var ws = workspaces.FirstOrDefault(w => w.Id == stat.WorkspaceId);
                if (ws == null) return null;

                return new HotWorkspaceEntry
                {
                    WorkspaceId = ws.Id,
                    WorkspaceCode = ws.Code ?? string.Empty,
                    WorkspaceName = ws.Name,
                    GenreIcon = ws.Genre?.Icon,
                    TaskAddedCount = stat.TaskAddedCount,
                    TaskCompletedCount = stat.TaskCompletedCount,
                    TotalTaskActivityCount = stat.TotalTaskActivityCount,
                };
            })
            .Where(x => x != null)
            .Cast<HotWorkspaceEntry>()
            .ToList();

        return new DashboardHotWorkspacesResponse
        {
            Period = periodString,
            Workspaces = hotWorkspaces,
        };
    }

    /// <summary>
    /// 集計期間の開始日時を取得
    /// </summary>
    private static DateTimeOffset GetPeriodStartDate(HotPeriod period)
    {
        var now = DateTimeOffset.UtcNow;
        return period switch
        {
            HotPeriod.Last24Hours => now.AddHours(-24),
            HotPeriod.Last1Week => now.AddDays(-7),
            _ => now.AddHours(-24),
        };
    }

    #endregion

    #region ヘルプコメント

    /// <summary>
    /// ヘルプコメント一覧を取得
    /// 組織設定の最大件数を使用
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <returns>ヘルプコメント一覧</returns>
    public async Task<DashboardHelpCommentsResponse> GetHelpCommentsAsync(int organizationId)
    {
        // 組織設定から表示件数を取得
        var orgSetting = await _context.OrganizationSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.OrganizationId == organizationId);
        var limit = orgSetting?.DashboardHelpCommentMaxCount ?? 6;

        // 組織内のワークスペースID一覧を取得
        var workspaceIds = await _context.Workspaces
            .Where(w => w.OrganizationId == organizationId && w.IsActive)
            .Select(w => w.Id)
            .ToListAsync();

        // HelpWanted タイプのコメントを取得（未完了・未破棄タスクのみ）
        var query = _context.TaskComments
            .AsNoTracking()
            .Include(c => c.User)
            .Include(c => c.WorkspaceTask)
                .ThenInclude(t => t.WorkspaceItem)
                    .ThenInclude(i => i!.Workspace)
            .Include(c => c.WorkspaceTask)
                .ThenInclude(t => t.AssignedUser)
            .Where(c =>
                c.CommentType == TaskCommentType.HelpWanted &&
                !c.IsDeleted &&
                c.WorkspaceTask != null &&
                !c.WorkspaceTask.IsCompleted &&
                !c.WorkspaceTask.IsDiscarded &&
                c.WorkspaceTask.WorkspaceItem != null &&
                workspaceIds.Contains(c.WorkspaceTask.WorkspaceItem.WorkspaceId)
            )
            .OrderByDescending(c => c.CreatedAt);

        // 総件数を取得
        var totalCount = await query.CountAsync();

        // 件数制限して取得
        var comments = await query
            .Take(limit)
            .Select(c => new HelpCommentItem
            {
                CommentId = c.Id,
                Content = c.Content,
                CreatedAt = c.CreatedAt,
                CommentUserId = c.UserId,
                CommentUsername = c.User.Username,
                CommentUserAvatarUrl = IdentityIconHelper.GetIdentityIconUrl(
                    iconType: c.User.AvatarType,
                    userId: c.User.Id,
                    username: c.User.Username,
                    email: c.User.Email,
                    avatarPath: c.User.UserAvatarPath
                ),
                TaskId = c.WorkspaceTaskId,
                TaskContent = c.WorkspaceTask!.Content,
                TaskAssigneeId = c.WorkspaceTask.AssignedUserId,
                TaskAssigneeName = c.WorkspaceTask.AssignedUser != null ? c.WorkspaceTask.AssignedUser.Username : null,
                WorkspaceId = c.WorkspaceTask.WorkspaceItem!.WorkspaceId,
                WorkspaceCode = c.WorkspaceTask.WorkspaceItem.Workspace!.Code ?? string.Empty,
                WorkspaceName = c.WorkspaceTask.WorkspaceItem.Workspace.Name ?? string.Empty,
                ItemId = c.WorkspaceTask.WorkspaceItemId,
                ItemCode = c.WorkspaceTask.WorkspaceItem.Code,
                ItemSubject = c.WorkspaceTask.WorkspaceItem.Subject,
            })
            .ToListAsync();

        return new DashboardHelpCommentsResponse
        {
            Comments = comments,
            TotalCount = totalCount,
        };
    }

    #endregion
}
