using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.DB;

namespace Pecus.Libs.Achievements.Strategies;

/// <summary>
/// 沈黙の守護者 - 自分が作成者でないタスクを10件完了した（サポート精神）
/// </summary>
public class UnsungHeroStrategy : AchievementStrategyBase
{
    private const int RequiredCount = 10;

    /// <summary>
    /// <see cref="UnsungHeroStrategy"/> クラスの新しいインスタンスを初期化します。
    /// </summary>
    /// <param name="context">データベースコンテキスト。</param>
    /// <param name="logger">ロガー。</param>
    public UnsungHeroStrategy(ApplicationDbContext context, ILogger<UnsungHeroStrategy> logger)
        : base(context, logger)
    {
    }

    /// <inheritdoc/>
    public override string AchievementCode => "UNSUNG_HERO";

    /// <inheritdoc/>
    public override async Task<IEnumerable<int>> EvaluateAsync(
        int organizationId,
        DateTimeOffset evaluationDate,
        CancellationToken cancellationToken = default)
    {
        var completedTasks = await Context.WorkspaceTasks
            .AsNoTracking()
            .Where(t => t.OrganizationId == organizationId)
            .Where(t => t.IsCompleted)
            .Select(t => new
            {
                t.AssignedUserId,
                t.CreatedByUserId
            })
            .ToListAsync(cancellationToken);

        var unsungHeroUserIds = completedTasks
            .Where(t => t.AssignedUserId != t.CreatedByUserId)
            .GroupBy(t => t.AssignedUserId)
            .Where(g => g.Count() >= RequiredCount)
            .OrderBy(g => g.Key)
            .Select(g => g.Key)
            .Take(MaxResultsPerEvaluation)
            .ToList();

        Logger.LogDebug(
            "UnsungHero evaluation for org {OrganizationId}: {Count} users qualified",
            organizationId,
            unsungHeroUserIds.Count);

        return unsungHeroUserIds;
    }
}
