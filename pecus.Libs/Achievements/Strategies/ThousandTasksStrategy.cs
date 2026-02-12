using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.DB;

namespace Pecus.Libs.Achievements.Strategies;

/// <summary>
/// 千本ノック - 累計1000件のタスクを完了した
/// </summary>
public class ThousandTasksStrategy : AchievementStrategyBase
{
    private const int RequiredCount = 1000;

    /// <summary>
    /// <see cref="ThousandTasksStrategy"/> クラスの新しいインスタンスを初期化します。
    /// </summary>
    /// <param name="context">データベースコンテキスト。</param>
    /// <param name="logger">ロガー。</param>
    public ThousandTasksStrategy(ApplicationDbContext context, ILogger<ThousandTasksStrategy> logger)
        : base(context, logger)
    {
    }

    /// <inheritdoc/>
    public override string AchievementCode => "THOUSAND_TASKS";

    /// <inheritdoc/>
    public override async Task<IEnumerable<int>> EvaluateAsync(
        int organizationId,
        DateTimeOffset evaluationDate,
        CancellationToken cancellationToken = default)
    {
        var thousandTasksUserIds = await Context.WorkspaceTasks
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
            "ThousandTasks evaluation for org {OrganizationId}: {Count} users qualified",
            organizationId,
            thousandTasksUserIds.Count);

        return thousandTasksUserIds;
    }
}