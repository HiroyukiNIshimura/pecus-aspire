using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.DB;

namespace Pecus.Libs.Achievements.Strategies;

/// <summary>
/// 百人力 - 累計100件のタスクを完了した
/// </summary>
public class CenturyStrategy : AchievementStrategyBase
{
    private const int RequiredCount = 100;

    /// <summary>
    /// <see cref="CenturyStrategy"/> クラスの新しいインスタンスを初期化します。
    /// </summary>
    /// <param name="context">データベースコンテキスト。</param>
    /// <param name="logger">ロガー。</param>
    public CenturyStrategy(ApplicationDbContext context, ILogger<CenturyStrategy> logger)
        : base(context, logger)
    {
    }

    /// <inheritdoc/>
    public override string AchievementCode => "CENTURY";

    /// <inheritdoc/>
    public override async Task<IEnumerable<int>> EvaluateAsync(
        int organizationId,
        DateTimeOffset evaluationDate,
        CancellationToken cancellationToken = default)
    {
        var centuryUserIds = await Context.WorkspaceTasks
            .AsNoTracking()
            .Where(t => t.OrganizationId == organizationId)
            .Where(t => t.IsCompleted)
            .Where(t => t.CompletedByUserId != null)
            .GroupBy(t => t.CompletedByUserId!.Value)
            .Where(g => g.Count() >= RequiredCount)
            .OrderBy(g => g.Key)
            .Select(g => g.Key)
            .Take(MaxResultsPerEvaluation)
            .ToListAsync(cancellationToken);

        Logger.LogDebug(
            "Century evaluation for org {OrganizationId}: {Count} users qualified",
            organizationId,
            centuryUserIds.Count);

        return centuryUserIds;
    }
}
