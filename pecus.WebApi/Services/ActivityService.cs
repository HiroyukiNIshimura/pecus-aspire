using Microsoft.EntityFrameworkCore;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Models.Requests.Activity;

namespace Pecus.Services;

/// <summary>
/// アクティビティサービス（コントローラー用）
/// </summary>
public class ActivityService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<ActivityService> _logger;
    private readonly TimeProvider _timeProvider;

    public ActivityService(
        ApplicationDbContext context,
        ILogger<ActivityService> logger,
        TimeProvider timeProvider)
    {
        _context = context;
        _logger = logger;
        _timeProvider = timeProvider;
    }

    /// <summary>
    /// アイテムのアクティビティを取得する（タイムライン表示用）
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">アイテムID</param>
    /// <param name="page">ページ番号（1から開始）</param>
    /// <param name="pageSize">ページサイズ</param>
    /// <returns>アイテムが見つからないまたはワークスペースが一致しない場合はnull、それ以外はアクティビティのリストと総件数のタプル</returns>
    public async Task<(List<Activity> Activities, int TotalCount)?> GetActivitiesByItemIdAsync(
        int workspaceId,
        int itemId,
        int page = 1,
        int pageSize = 20
    )
    {
        // アイテムの存在確認とワークスペースID一致確認
        var item = await _context.WorkspaceItems
            .Where(wi => wi.Id == itemId && wi.WorkspaceId == workspaceId)
            .Select(wi => new { wi.Id })
            .FirstOrDefaultAsync();

        if (item == null)
        {
            return null;
        }

        var query = _context.Activities.Where(a => a.ItemId == itemId);

        var totalCount = await query.CountAsync();

        var activities = await query
            .OrderByDescending(a => a.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Include(a => a.User)
            .Include(a => a.Item)
            .ToListAsync();

        return (activities, totalCount);
    }

    /// <summary>
    /// ユーザーのアクティビティを取得する（活動レポート用）
    /// </summary>
    /// <param name="userId">ユーザーID</param>
    /// <param name="page">ページ番号（1から開始）</param>
    /// <param name="pageSize">ページサイズ</param>
    /// <param name="period">期間フィルタ（省略時は全期間）</param>
    /// <returns>アクティビティのリストと総件数</returns>
    public async Task<(List<Activity> Activities, int TotalCount)> GetActivitiesByUserIdAsync(
        int userId,
        int page = 1,
        int pageSize = 20,
        ActivityPeriod? period = null
    )
    {
        var query = _context.Activities.Where(a => a.UserId == userId);

        // 期間フィルタ
        if (period.HasValue)
        {
            var (start, end) = GetDateRange(period.Value);
            query = query.Where(a => a.CreatedAt >= start && a.CreatedAt < end);
        }

        var totalCount = await query.CountAsync();

        var activities = await query
            .OrderByDescending(a => a.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Include(a => a.Item)
            .Include(a => a.Workspace)
                .ThenInclude(w => w!.Genre)
            .ToListAsync();

        return (activities, totalCount);
    }

    /// <summary>
    /// 期間から日付範囲を計算（UTC基準）
    /// </summary>
    private (DateTimeOffset Start, DateTimeOffset End) GetDateRange(ActivityPeriod period)
    {
        var now = _timeProvider.GetUtcNow();
        var today = now.Date;

        var (start, end) = period switch
        {
            ActivityPeriod.Today => (today, today.AddDays(1)),
            ActivityPeriod.Yesterday => (today.AddDays(-1), today),
            ActivityPeriod.ThisWeek => (StartOfWeek(today), StartOfWeek(today).AddDays(7)),
            ActivityPeriod.LastWeek => (StartOfWeek(today).AddDays(-7), StartOfWeek(today)),
            ActivityPeriod.ThisMonth => (new DateTime(today.Year, today.Month, 1), new DateTime(today.Year, today.Month, 1).AddMonths(1)),
            ActivityPeriod.LastMonth => (new DateTime(today.Year, today.Month, 1).AddMonths(-1), new DateTime(today.Year, today.Month, 1)),
            _ => throw new ArgumentOutOfRangeException(nameof(period))
        };

        // PostgreSQLのtimestamp with time zoneにはUTC (Offset=0) でのみ書き込み可能
        return (new DateTimeOffset(start, TimeSpan.Zero), new DateTimeOffset(end, TimeSpan.Zero));
    }

    /// <summary>
    /// 週の開始日（月曜）を取得
    /// </summary>
    private static DateTime StartOfWeek(DateTime date)
    {
        var diff = (7 + (date.DayOfWeek - DayOfWeek.Monday)) % 7;
        return date.AddDays(-diff);
    }
}