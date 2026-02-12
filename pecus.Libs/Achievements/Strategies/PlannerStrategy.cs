using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.DB;

namespace Pecus.Libs.Achievements.Strategies;

/// <summary>
/// プランナー - 見積もり工数を設定したタスクを完了した
/// </summary>
public class PlannerStrategy : AchievementStrategyBase
{
    /// <summary>
    /// <see cref="PlannerStrategy"/> クラスの新しいインスタンスを初期化します。
    /// </summary>
    /// <param name="context">データベースコンテキスト。</param>
    /// <param name="logger">ロガー。</param>
    public PlannerStrategy(ApplicationDbContext context, ILogger<PlannerStrategy> logger)
        : base(context, logger)
    {
    }

    /// <inheritdoc/>
    public override string AchievementCode => "PLANNER";

    /// <inheritdoc/>
    public override async Task<IEnumerable<int>> EvaluateAsync(
        int organizationId,
        DateTimeOffset evaluationDate,
        CancellationToken cancellationToken = default)
    {
        // 見積もり工数を設定して完了したタスクがあるユーザーを取得
        var plannerUserIds = await Context.WorkspaceTasks
            .AsNoTracking()
            .Where(t => t.OrganizationId == organizationId)
            .Where(t => t.IsCompleted)
            .Where(t => t.CompletedByUserId != null)
            .Where(t => t.EstimatedHours != null && t.EstimatedHours > 0)
            .Select(t => t.CompletedByUserId!.Value)
            .Distinct()
            .OrderBy(userId => userId)
            .Take(MaxResultsPerEvaluation)
            .ToListAsync(cancellationToken);

        Logger.LogDebug(
            "Planner evaluation for org {OrganizationId}: {Count} users qualified",
            organizationId,
            plannerUserIds.Count);

        return plannerUserIds;
    }
}