using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models.Enums;

namespace Pecus.Libs.Achievements.Strategies;

/// <summary>
/// 約束の人 - 期限変更なしで完了したタスクが20件以上（Activity経由で判定）
/// </summary>
public class PromiseKeeperStrategy : AchievementStrategyBase
{
    private const int RequiredCount = 20;

    /// <summary>
    /// <see cref="PromiseKeeperStrategy"/> クラスの新しいインスタンスを初期化します。
    /// </summary>
    /// <param name="context">データベースコンテキスト。</param>
    /// <param name="logger">ロガー。</param>
    public PromiseKeeperStrategy(ApplicationDbContext context, ILogger<PromiseKeeperStrategy> logger)
        : base(context, logger)
    {
    }

    /// <inheritdoc/>
    public override string AchievementCode => "PROMISE_KEEPER";

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

        var dueDateChangedItemIds = await Context.Activities
            .AsNoTracking()
            .Where(a => workspaceIds.Contains(a.WorkspaceId))
            .Where(a => a.ActionType == ActivityActionType.TaskDueDateChanged)
            .Select(a => a.ItemId)
            .Distinct()
            .ToListAsync(cancellationToken);

        var promiseKeeperUserIds = await Context.WorkspaceTasks
            .AsNoTracking()
            .Where(t => t.OrganizationId == organizationId)
            .Where(t => t.IsCompleted)
            .Where(t => t.CompletedByUserId != null)
            .Where(t => !dueDateChangedItemIds.Contains(t.WorkspaceItemId))
            .GroupBy(t => t.CompletedByUserId!.Value)
            .Where(g => g.Count() >= RequiredCount)
            .OrderBy(g => g.Key)
            .Select(g => g.Key)
            .Take(MaxResultsPerEvaluation)
            .ToListAsync(cancellationToken);

        Logger.LogDebug(
            "PromiseKeeper evaluation for org {OrganizationId}: {Count} users qualified",
            organizationId,
            promiseKeeperUserIds.Count);

        return promiseKeeperUserIds;
    }
}
