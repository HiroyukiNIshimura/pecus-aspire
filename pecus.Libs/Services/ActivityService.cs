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
    /// <param name="details">操作の詳細データ（JSON文字列、呼び出し元で事前にシリアライズ済み）</param>
    /// <remarks>
    /// このメソッドはHangfireのバックグラウンドジョブとして実行されます。
    /// エラーが発生した場合はログに記録し、Hangfireのリトライ機能に委ねます。
    /// detailsがnullまたは空の場合、変更がないと判断して記録をスキップします。
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
            // Created以外でdetailsがnullまたは空の場合は変更なしと判断してスキップ
            if (actionType != ActivityActionType.Created && string.IsNullOrWhiteSpace(details))
            {
                _logger.LogInformation(
                    "Skipping activity recording (no change detected): WorkspaceId={WorkspaceId}, ItemId={ItemId}, ActionType={ActionType}",
                    workspaceId,
                    itemId,
                    actionType
                );
                return;
            }

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

    /// <summary>
    /// 変更検出用ヘルパー: 2つの値が異なる場合にJSON形式のdetailsを生成
    /// </summary>
    /// <typeparam name="T">比較する値の型</typeparam>
    /// <param name="oldValue">変更前の値</param>
    /// <param name="newValue">変更後の値</param>
    /// <returns>変更があればJSON文字列、変更がなければnull</returns>
    public static string? CreateChangeDetails<T>(T? oldValue, T? newValue)
    {
        // 値が同じ場合はnullを返す（変更なし）
        if (EqualityComparer<T>.Default.Equals(oldValue, newValue))
        {
            return null;
        }

        // 変更があった場合はJSON化して返す
        return System.Text.Json.JsonSerializer.Serialize(new { old = oldValue, @new = newValue });
    }

    /// <summary>
    /// 本文更新専用の変更検出ヘルパー: oldValueのみを保存（データサイズ削減のため）
    /// </summary>
    /// <param name="oldValue">変更前の本文</param>
    /// <param name="newValue">変更後の本文</param>
    /// <returns>変更があればJSON文字列（oldのみ）、変更がなければnull</returns>
    public static string? CreateBodyChangeDetails(string? oldValue, string? newValue)
    {
        // 値が同じ場合はnullを返す（変更なし）
        if (EqualityComparer<string>.Default.Equals(oldValue, newValue))
        {
            return null;
        }

        // 本文の場合は old のみを保存（new は現在の Item.Body から取得可能）
        return System.Text.Json.JsonSerializer.Serialize(new { old = oldValue });
    }
}
