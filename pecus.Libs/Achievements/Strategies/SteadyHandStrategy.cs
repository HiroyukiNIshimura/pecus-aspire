using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.DB;

namespace Pecus.Libs.Achievements.Strategies;

/// <summary>
/// 安定の担当者 - 30日連続でタスクを担当し続けている（アクティブなタスクを持ち続けている）
/// </summary>
public class SteadyHandStrategy : AchievementStrategyBase
{
    private const int RequiredDays = 30;

    /// <summary>
    /// <see cref="SteadyHandStrategy"/> クラスの新しいインスタンスを初期化します。
    /// </summary>
    /// <param name="context">データベースコンテキスト。</param>
    /// <param name="logger">ロガー。</param>
    public SteadyHandStrategy(ApplicationDbContext context, ILogger<SteadyHandStrategy> logger)
        : base(context, logger)
    {
    }

    /// <inheritdoc/>
    public override string AchievementCode => "STEADY_HAND";

    /// <inheritdoc/>
    public override async Task<IEnumerable<int>> EvaluateAsync(
        int organizationId,
        DateTimeOffset evaluationDate,
        CancellationToken cancellationToken = default)
    {
        var thresholdDate = evaluationDate.AddDays(-RequiredDays);

        var steadyHandUserIds = await Context.WorkspaceTasks
            .AsNoTracking()
            .Where(t => t.OrganizationId == organizationId)
            .Where(t => !t.IsCompleted && !t.IsDiscarded)
            .Where(t => t.CreatedAt <= thresholdDate)
            .Select(t => t.AssignedUserId)
            .Distinct()
            .Take(MaxResultsPerEvaluation)
            .ToListAsync(cancellationToken);

        Logger.LogDebug(
            "SteadyHand evaluation for org {OrganizationId}: {Count} users qualified",
            organizationId,
            steadyHandUserIds.Count);

        return steadyHandUserIds;
    }
}
