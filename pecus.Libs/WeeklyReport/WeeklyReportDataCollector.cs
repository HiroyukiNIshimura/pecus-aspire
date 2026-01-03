using Microsoft.EntityFrameworkCore;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Libs.Statistics;
using Pecus.Libs.WeeklyReport.Models;

namespace Pecus.Libs.WeeklyReport;

/// <summary>
/// 週間レポート用のデータ収集サービス
/// </summary>
public class WeeklyReportDataCollector
{
    private readonly ApplicationDbContext _dbContext;

    /// <summary>
    /// コンストラクタ
    /// </summary>
    /// <param name="dbContext">DBコンテキスト</param>
    public WeeklyReportDataCollector(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    /// <summary>
    /// 組織内の配信対象ユーザー一覧を取得（Owner または Member のみ、Viewer 除外）
    /// </summary>
    public async Task<List<(int UserId, string UserName, string Email, bool IsOwner)>> GetDeliveryTargetUsersAsync(
        int organizationId,
        CancellationToken cancellationToken = default)
    {
        var users = await _dbContext.WorkspaceUsers
            .Where(wu => wu.Workspace.OrganizationId == organizationId)
            .Where(wu => wu.WorkspaceRole == WorkspaceRole.Owner || wu.WorkspaceRole == WorkspaceRole.Member)
            .Select(wu => new
            {
                wu.UserId,
                wu.User.Username,
                wu.User.Email,
                wu.WorkspaceRole
            })
            .Distinct()
            .ToListAsync(cancellationToken);

        // ユーザーごとに最も高い役割を判定（Owner > Member）
        var userRoles = users
            .GroupBy(u => u.UserId)
            .Select(g => (
                UserId: g.Key,
                UserName: g.First().Username,
                Email: g.First().Email,
                IsOwner: g.Any(u => u.WorkspaceRole == WorkspaceRole.Owner)
            ))
            .ToList();

        return userRoles;
    }

    /// <summary>
    /// ユーザーの週間レポートデータを収集
    /// </summary>
    public async Task<UserWeeklyReportData> CollectUserReportDataAsync(
        int organizationId,
        string organizationName,
        int userId,
        string userName,
        string email,
        bool isOwner,
        DateOnly weekStartDate,
        DateOnly weekEndDate,
        CancellationToken cancellationToken = default)
    {
        var reportData = new UserWeeklyReportData
        {
            UserId = userId,
            UserName = userName,
            Email = email,
            OrganizationId = organizationId,
            OrganizationName = organizationName,
            WeekStartDate = weekStartDate,
            WeekEndDate = weekEndDate
        };

        // 全員共通: 個人タスクサマリ
        reportData.PersonalSummary = await GetPersonalSummaryAsync(
            organizationId, userId, weekStartDate, weekEndDate, cancellationToken);

        // オーナーのみ: ワークスペース状況
        if (isOwner)
        {
            reportData.OwnerWorkspaces = await GetOwnerWorkspacesAsync(
                organizationId, userId, weekStartDate, weekEndDate, cancellationToken);
        }

        return reportData;
    }

    /// <summary>
    /// 個人タスクサマリを取得（全員共通）
    /// </summary>
    public async Task<PersonalTaskSummary> GetPersonalSummaryAsync(
        int organizationId,
        int userId,
        DateOnly weekStartDate,
        DateOnly weekEndDate,
        CancellationToken cancellationToken = default)
    {
        var weekStart = weekStartDate.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var weekEnd = weekEndDate.ToDateTime(TimeOnly.MaxValue, DateTimeKind.Utc);
        var today = DateTimeOffset.UtcNow;

        var tasks = await _dbContext.WorkspaceTasks
            .Where(t => t.OrganizationId == organizationId)
            .Where(t => t.AssignedUserId == userId)
            .Select(t => new
            {
                t.IsCompleted,
                t.IsDiscarded,
                t.CompletedAt,
                t.DueDate
            })
            .ToListAsync(cancellationToken);

        return new PersonalTaskSummary
        {
            CompletedCount = tasks.Count(t =>
                t.IsCompleted &&
                t.CompletedAt.HasValue &&
                t.CompletedAt.Value >= weekStart &&
                t.CompletedAt.Value <= weekEnd),
            RemainingCount = tasks.Count(t =>
                !t.IsCompleted && !t.IsDiscarded),
            OverdueCount = tasks.Count(t =>
                !t.IsCompleted && !t.IsDiscarded && t.DueDate < today)
        };
    }

    /// <summary>
    /// オーナー向けワークスペース状況を取得（責任アイテム含む）
    /// </summary>
    public async Task<List<OwnerWorkspaceSummary>> GetOwnerWorkspacesAsync(
        int organizationId,
        int userId,
        DateOnly weekStartDate,
        DateOnly weekEndDate,
        CancellationToken cancellationToken = default)
    {
        var weekStart = weekStartDate.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var weekEnd = weekEndDate.ToDateTime(TimeOnly.MaxValue, DateTimeKind.Utc);
        var today = DateTimeOffset.UtcNow;
        var nextWeekStart = weekEndDate.AddDays(1);
        var nextWeekEnd = nextWeekStart.AddDays(6);
        var nextWeekStartDt = nextWeekStart.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var nextWeekEndDt = nextWeekEnd.ToDateTime(TimeOnly.MaxValue, DateTimeKind.Utc);

        // オーナーのワークスペース一覧を取得
        var ownerWorkspaces = await _dbContext.WorkspaceUsers
            .Where(wu => wu.Workspace.OrganizationId == organizationId)
            .Where(wu => wu.UserId == userId)
            .Where(wu => wu.WorkspaceRole == WorkspaceRole.Owner)
            .Select(wu => new
            {
                wu.WorkspaceId,
                wu.Workspace.Name
            })
            .ToListAsync(cancellationToken);

        var result = new List<OwnerWorkspaceSummary>();

        foreach (var ws in ownerWorkspaces)
        {
            // ワークスペース内のタスク一覧を取得
            var wsTasks = await _dbContext.WorkspaceTasks
                .Where(t => t.WorkspaceId == ws.WorkspaceId)
                .Select(t => new
                {
                    t.IsCompleted,
                    t.IsDiscarded,
                    t.CompletedAt,
                    t.DueDate
                })
                .ToListAsync(cancellationToken);

            var wsSummary = new OwnerWorkspaceSummary
            {
                WorkspaceId = ws.WorkspaceId,
                WorkspaceName = ws.Name,
                InProgressCount = wsTasks.Count(t => !t.IsCompleted && !t.IsDiscarded),
                CompletedThisWeekCount = wsTasks.Count(t =>
                    t.IsCompleted &&
                    t.CompletedAt.HasValue &&
                    t.CompletedAt.Value >= weekStart &&
                    t.CompletedAt.Value <= weekEnd),
                OverdueCount = wsTasks.Count(t =>
                    !t.IsCompleted && !t.IsDiscarded && t.DueDate < today),
                DueNextWeekCount = wsTasks.Count(t =>
                    !t.IsCompleted && !t.IsDiscarded &&
                    t.DueDate >= nextWeekStartDt && t.DueDate <= nextWeekEndDt)
            };

            // このWSでオーナーがコミッターになっているアイテムを取得
            wsSummary.CommitterItems = await GetCommitterItemsForWorkspaceAsync(
                ws.WorkspaceId, userId, today, nextWeekStartDt, nextWeekEndDt, cancellationToken);

            result.Add(wsSummary);
        }

        return result;
    }

    /// <summary>
    /// 特定ワークスペース内でコミッターになっているアイテムを取得
    /// </summary>
    private async Task<List<CommitterItemSummary>> GetCommitterItemsForWorkspaceAsync(
        int workspaceId,
        int userId,
        DateTimeOffset today,
        DateTimeOffset nextWeekStart,
        DateTimeOffset nextWeekEnd,
        CancellationToken cancellationToken = default)
    {
        // コミッターになっている公開済みアイテム（IsDraft = false AND IsArchived = false）
        var items = await _dbContext.WorkspaceItems
            .Where(i => i.WorkspaceId == workspaceId)
            .Where(i => i.CommitterId == userId)
            .Where(i => !i.IsDraft && !i.IsArchived)
            .Select(i => new
            {
                i.Id,
                i.Subject
            })
            .ToListAsync(cancellationToken);

        var result = new List<CommitterItemSummary>();

        foreach (var item in items)
        {
            var itemTasks = await _dbContext.WorkspaceTasks
                .Where(t => t.WorkspaceItemId == item.Id)
                .Select(t => new
                {
                    t.IsCompleted,
                    t.IsDiscarded,
                    t.DueDate
                })
                .ToListAsync(cancellationToken);

            var totalCount = itemTasks.Count(t => !t.IsDiscarded);
            var completedCount = itemTasks.Count(t => t.IsCompleted && !t.IsDiscarded);

            result.Add(new CommitterItemSummary
            {
                ItemId = item.Id,
                ItemName = item.Subject,
                TotalTaskCount = totalCount,
                CompletedTaskCount = completedCount,
                ProgressPercent = totalCount > 0 ? (int)Math.Round((double)completedCount / totalCount * 100) : 0,
                RemainingTaskCount = itemTasks.Count(t => !t.IsCompleted && !t.IsDiscarded),
                OverdueCount = itemTasks.Count(t =>
                    !t.IsCompleted && !t.IsDiscarded && t.DueDate < today),
                DueNextWeekCount = itemTasks.Count(t =>
                    !t.IsCompleted && !t.IsDiscarded &&
                    t.DueDate >= nextWeekStart && t.DueDate <= nextWeekEnd)
            });
        }

        return result;
    }

    /// <summary>
    /// 前週の月曜～日曜の日付範囲を計算（月曜起点）
    /// </summary>
    public static (DateOnly WeekStart, DateOnly WeekEnd) GetLastWeekDateRange(DateOnly today)
        => StatisticsDateHelper.GetLastWeekDateRange(today);

    /// <summary>
    /// 来週の月曜～日曜の日付範囲を計算（月曜起点）
    /// </summary>
    public static (DateOnly WeekStart, DateOnly WeekEnd) GetNextWeekDateRange(DateOnly today)
        => StatisticsDateHelper.GetNextWeekDateRange(today);
}