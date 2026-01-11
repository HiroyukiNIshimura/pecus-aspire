using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models.Enums;

namespace Pecus.Libs.Achievements.Strategies;

/// <summary>
/// 一発完了 - リオープンされずに完了したタスクが50件以上（Activity経由で判定）
/// </summary>
public class FirstTryStrategy : AchievementStrategyBase
{
    private const int RequiredCount = 50;

    /// <summary>
    /// <see cref="FirstTryStrategy"/> クラスの新しいインスタンスを初期化します。
    /// </summary>
    /// <param name="context">データベースコンテキスト。</param>
    /// <param name="logger">ロガー。</param>
    public FirstTryStrategy(ApplicationDbContext context, ILogger<FirstTryStrategy> logger)
        : base(context, logger)
    {
    }

    /// <inheritdoc/>
    public override string AchievementCode => "FIRST_TRY";

    /// <inheritdoc/>
    public override async Task<IEnumerable<int>> EvaluateAsync(
        int organizationId,
        DateTimeOffset evaluationDate,
        CancellationToken cancellationToken = default)
    {
        var workspaceIds = await Context.Workspaces
            .AsNoTracking()
            .Where(w => w.OrganizationId == organizationId)
            .Select(w => w.Id)
            .ToListAsync(cancellationToken);

        if (workspaceIds.Count == 0)
        {
            return [];
        }

        var reopenedItemIds = await Context.Activities
            .AsNoTracking()
            .Where(a => workspaceIds.Contains(a.WorkspaceId))
            .Where(a => a.ActionType == ActivityActionType.TaskReopened)
            .Select(a => a.ItemId)
            .Distinct()
            .ToListAsync(cancellationToken);

        var firstTryUserIds = await Context.Activities
            .AsNoTracking()
            .Where(a => workspaceIds.Contains(a.WorkspaceId))
            .Where(a => a.ActionType == ActivityActionType.TaskCompleted)
            .Where(a => !reopenedItemIds.Contains(a.ItemId))
            .Where(a => a.UserId != null)
            .GroupBy(a => a.UserId!.Value)
            .Where(g => g.Count() >= RequiredCount)
            .Select(g => g.Key)
            .ToListAsync(cancellationToken);

        Logger.LogDebug(
            "FirstTry evaluation for org {OrganizationId}: {Count} users qualified",
            organizationId,
            firstTryUserIds.Count);

        return firstTryUserIds;
    }
}
