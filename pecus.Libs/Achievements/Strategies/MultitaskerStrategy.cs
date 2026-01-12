using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.DB;

namespace Pecus.Libs.Achievements.Strategies;

/// <summary>
/// マルチタスカー - 同時に10件以上のタスクを担当している
/// </summary>
public class MultitaskerStrategy : AchievementStrategyBase
{
    private const int RequiredCount = 10;

    /// <summary>
    /// <see cref="MultitaskerStrategy"/> クラスの新しいインスタンスを初期化します。
    /// </summary>
    /// <param name="context">データベースコンテキスト。</param>
    /// <param name="logger">ロガー。</param>
    public MultitaskerStrategy(ApplicationDbContext context, ILogger<MultitaskerStrategy> logger)
        : base(context, logger)
    {
    }

    /// <inheritdoc/>
    public override string AchievementCode => "MULTITASKER";

    /// <inheritdoc/>
    public override async Task<IEnumerable<int>> EvaluateAsync(
        int organizationId,
        DateTimeOffset evaluationDate,
        CancellationToken cancellationToken = default)
    {
        var multitaskerUserIds = await Context.WorkspaceTasks
            .AsNoTracking()
            .Where(t => t.OrganizationId == organizationId)
            .Where(t => !t.IsCompleted && !t.IsDiscarded)
            .GroupBy(t => t.AssignedUserId)
            .Where(g => g.Count() >= RequiredCount)
            .OrderBy(g => g.Key)
            .Select(g => g.Key)
            .Take(MaxResultsPerEvaluation)
            .ToListAsync(cancellationToken);

        Logger.LogDebug(
            "Multitasker evaluation for org {OrganizationId}: {Count} users qualified",
            organizationId,
            multitaskerUserIds.Count);

        return multitaskerUserIds;
    }
}
