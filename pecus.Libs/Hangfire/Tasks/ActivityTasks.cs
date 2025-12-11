using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;

namespace Pecus.Libs.Hangfire.Tasks;

/// <summary>
/// アクティビティ記録用Hangfireタスク
/// </summary>
public class ActivityTasks
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<ActivityTasks> _logger;

    /// <summary>
    /// コンストラクタ
    /// </summary>
    public ActivityTasks(ApplicationDbContext context, ILogger<ActivityTasks> logger)
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
                "Recording activity: WorkspaceId={WorkspaceId}, ItemId={ItemId}, ActionType={ActionType}",
                workspaceId,
                itemId,
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

        // 変更がある場合はJSON形式で返す
        var changeData = new { old = oldValue, @new = newValue };
        return System.Text.Json.JsonSerializer.Serialize(changeData);
    }

    /// <summary>
    /// 本文更新用の変更検出ヘルパー: oldのみを保存（データサイズ削減のため）
    /// </summary>
    /// <param name="oldValue">変更前の本文</param>
    /// <param name="newValue">変更後の本文</param>
    /// <returns>変更があればJSON文字列（oldのみ）、変更がなければnull</returns>
    public static string? CreateBodyChangeDetails(string? oldValue, string? newValue)
    {
        // 値が同じ場合はnullを返す（変更なし）
        if (oldValue == newValue)
        {
            return null;
        }

        // 変更がある場合はoldのみをJSON形式で返す（newはItem.Bodyから取得可能）
        var changeData = new { old = oldValue };
        return System.Text.Json.JsonSerializer.Serialize(changeData);
    }
}
