using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;

namespace Pecus.Libs.Services;

/// <summary>
/// アクティビティサービス
/// アイテムに対する操作履歴を記録・取得する
/// </summary>
public class ActivityService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<ActivityService> _logger;

    /// <summary>
    /// ActivityService のコンストラクタ
    /// </summary>
    /// <param name="context">DBコンテキスト</param>
    /// <param name="logger">ロガー</param>
    public ActivityService(ApplicationDbContext context, ILogger<ActivityService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// アクティビティを記録する（Hangfireジョブから呼び出される）
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">アイテムID</param>
    /// <param name="userId">操作したユーザーID（NULL = システム操作）</param>
    /// <param name="actionType">操作タイプ</param>
    /// <param name="details">操作の詳細データ（JSON文字列）</param>
    /// <remarks>
    /// このメソッドはHangfireのバックグラウンドジョブとして実行されます。
    /// エラーが発生した場合はログに記録し、Hangfireのリトライ機能に委ねます。
    /// </remarks>
    public async Task RecordActivityAsync(
        int workspaceId,
        int itemId,
        int? userId,
        ActivityActionType actionType,
        string? details = null
    )
    {
        try
        {
            _logger.LogInformation(
                "Recording activity: WorkspaceId={WorkspaceId}, ItemId={ItemId}, UserId={UserId}, ActionType={ActionType}",
                workspaceId,
                itemId,
                userId,
                actionType
            );

            var activity = new Activity
            {
                WorkspaceId = workspaceId,
                ItemId = itemId,
                UserId = userId,
                ActionType = actionType,
                Details = details,
                CreatedAt = DateTimeOffset.UtcNow
            };

            _context.Activities.Add(activity);
            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Activity recorded successfully: Id={ActivityId}, ActionType={ActionType}",
                activity.Id,
                actionType
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Failed to record activity: WorkspaceId={WorkspaceId}, ItemId={ItemId}, ActionType={ActionType}",
                workspaceId,
                itemId,
                actionType
            );
            // Hangfireのリトライ機能に委ねるため再スロー
            throw;
        }
    }

    /// <summary>
    /// アイテムのアクティビティを取得する（タイムライン表示用）
    /// </summary>
    /// <param name="itemId">アイテムID</param>
    /// <param name="limit">取得件数（デフォルト: 50）</param>
    /// <returns>アクティビティのリスト（新しい順）</returns>
    public async Task<List<Activity>> GetActivitiesByItemIdAsync(int itemId, int limit = 50)
    {
        return await _context
            .Activities.Where(a => a.ItemId == itemId)
            .OrderByDescending(a => a.CreatedAt)
            .Take(limit)
            .Include(a => a.User)
            .ToListAsync();
    }

    /// <summary>
    /// ユーザーのアクティビティを取得する（活動レポート用）
    /// </summary>
    /// <param name="userId">ユーザーID</param>
    /// <param name="from">開始日時</param>
    /// <param name="to">終了日時</param>
    /// <returns>アクティビティのリスト</returns>
    public async Task<List<Activity>> GetActivitiesByUserIdAsync(
        int userId,
        DateTimeOffset from,
        DateTimeOffset to
    )
    {
        return await _context
            .Activities.Where(a => a.UserId == userId && a.CreatedAt >= from && a.CreatedAt <= to)
            .OrderByDescending(a => a.CreatedAt)
            .Include(a => a.Item)
            .Include(a => a.Workspace)
            .ToListAsync();
    }

    /// <summary>
    /// ワークスペースのアクティビティを取得する（統計用）
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="from">開始日時</param>
    /// <param name="to">終了日時</param>
    /// <returns>アクティビティのリスト</returns>
    public async Task<List<Activity>> GetActivitiesByWorkspaceIdAsync(
        int workspaceId,
        DateTimeOffset from,
        DateTimeOffset to
    )
    {
        return await _context
            .Activities.Where(a =>
                a.WorkspaceId == workspaceId && a.CreatedAt >= from && a.CreatedAt <= to
            )
            .OrderByDescending(a => a.CreatedAt)
            .Include(a => a.Item)
            .Include(a => a.User)
            .ToListAsync();
    }
}
