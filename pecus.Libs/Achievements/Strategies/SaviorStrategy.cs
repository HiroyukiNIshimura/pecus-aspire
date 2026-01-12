using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models.Enums;

namespace Pecus.Libs.Achievements.Strategies;

/// <summary>
/// 救世主 - リオープンされたタスクを完了した（Activity経由で判定）
/// </summary>
public class SaviorStrategy : AchievementStrategyBase
{
    /// <summary>
    /// <see cref="SaviorStrategy"/> クラスの新しいインスタンスを初期化します。
    /// </summary>
    /// <param name="context">データベースコンテキスト。</param>
    /// <param name="logger">ロガー。</param>
    public SaviorStrategy(ApplicationDbContext context, ILogger<SaviorStrategy> logger)
        : base(context, logger)
    {
    }

    /// <inheritdoc/>
    public override string AchievementCode => "SAVIOR";

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

        if (reopenedItemIds.Count == 0)
        {
            return [];
        }

        var completedAfterReopen = await Context.Activities
            .AsNoTracking()
            .Where(a => workspaceIds.Contains(a.WorkspaceId))
            .Where(a => a.ActionType == ActivityActionType.TaskCompleted)
            .Where(a => reopenedItemIds.Contains(a.ItemId))
            .Where(a => a.UserId != null)
            .Select(a => a.UserId!.Value)
            .Distinct()
            .Take(MaxResultsPerEvaluation)
            .ToListAsync(cancellationToken);

        Logger.LogDebug(
            "Savior evaluation for org {OrganizationId}: {Count} users qualified",
            organizationId,
            completedAfterReopen.Count);

        return completedAfterReopen;
    }
}
