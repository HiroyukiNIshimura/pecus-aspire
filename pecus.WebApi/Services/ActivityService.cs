using Microsoft.EntityFrameworkCore;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;

namespace Pecus.Services;

/// <summary>
/// アクティビティサービス（コントローラー用）
/// </summary>
public class ActivityService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<ActivityService> _logger;

    public ActivityService(ApplicationDbContext context, ILogger<ActivityService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// アイテムのアクティビティを取得する（タイムライン表示用）
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">アイテムID</param>
    /// <param name="page">ページ番号（1から開始）</param>
    /// <param name="pageSize">ページサイズ</param>
    /// <param name="startDate">開始日時</param>
    /// <param name="endDate">終了日時</param>
    /// <returns>アイテムが見つからないまたはワークスペースが一致しない場合はnull、それ以外はアクティビティのリストと総件数のタプル</returns>
    public async Task<(List<Activity> Activities, int TotalCount)?> GetActivitiesByItemIdAsync(
        int workspaceId,
        int itemId,
        int page = 1,
        int pageSize = 20,
        DateTimeOffset? startDate = null,
        DateTimeOffset? endDate = null
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

        var query = _context
            .Activities.Where(a => a.ItemId == itemId);

        // 日付範囲フィルタ
        if (startDate.HasValue)
        {
            query = query.Where(a => a.CreatedAt >= startDate.Value);
        }

        if (endDate.HasValue)
        {
            query = query.Where(a => a.CreatedAt <= endDate.Value);
        }

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
    /// <param name="startDate">開始日時</param>
    /// <param name="endDate">終了日時</param>
    /// <returns>アクティビティのリストと総件数</returns>
    public async Task<(List<Activity> Activities, int TotalCount)> GetActivitiesByUserIdAsync(
        int userId,
        int page = 1,
        int pageSize = 20,
        DateTimeOffset? startDate = null,
        DateTimeOffset? endDate = null
    )
    {
        var query = _context
            .Activities.Where(a => a.UserId == userId);

        // 日付範囲フィルタ
        if (startDate.HasValue)
        {
            query = query.Where(a => a.CreatedAt >= startDate.Value);
        }

        if (endDate.HasValue)
        {
            query = query.Where(a => a.CreatedAt <= endDate.Value);
        }

        var totalCount = await query.CountAsync();

        var activities = await query
            .OrderByDescending(a => a.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Include(a => a.Item)
            .Include(a => a.Workspace)
            .ToListAsync();

        return (activities, totalCount);
    }

    /// <summary>
    /// ワークスペースのアクティビティを取得する（統計用）
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="page">ページ番号（1から開始）</param>
    /// <param name="pageSize">ページサイズ</param>
    /// <param name="startDate">開始日時</param>
    /// <param name="endDate">終了日時</param>
    /// <returns>アクティビティのリストと総件数</returns>
    public async Task<(List<Activity> Activities, int TotalCount)> GetActivitiesByWorkspaceIdAsync(
        int workspaceId,
        int page = 1,
        int pageSize = 20,
        DateTimeOffset? startDate = null,
        DateTimeOffset? endDate = null
    )
    {
        var query = _context
            .Activities.Where(a => a.WorkspaceId == workspaceId);

        // 日付範囲フィルタ
        if (startDate.HasValue)
        {
            query = query.Where(a => a.CreatedAt >= startDate.Value);
        }

        if (endDate.HasValue)
        {
            query = query.Where(a => a.CreatedAt <= endDate.Value);
        }

        var totalCount = await query.CountAsync();

        var activities = await query
            .OrderByDescending(a => a.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Include(a => a.Item)
            .Include(a => a.User)
            .ToListAsync();

        return (activities, totalCount);
    }
}
