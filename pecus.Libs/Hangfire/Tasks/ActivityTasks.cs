using Microsoft.Extensions.Logging;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;

namespace Pecus.Libs.Hangfire.Tasks;

/// <summary>
/// アクティビティ記録用Hangfireタスク
/// 責務: DBへのActivity INSERT のみ（変更検出やJSON生成は行わない）
/// </summary>
/// <remarks>
/// 変更検出とJSON生成は <see cref="ActivityDetailsBuilder"/> を使用し、
/// サービス層で事前に行ってからこのタスクに渡す。
/// </remarks>
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
    /// <param name="details">操作の詳細データ（JSON文字列、ActivityDetailsBuilder で生成済み）</param>
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
}