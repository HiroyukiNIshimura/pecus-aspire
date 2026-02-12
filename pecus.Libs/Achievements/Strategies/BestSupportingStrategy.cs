using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.DB;

namespace Pecus.Libs.Achievements.Strategies;

/// <summary>
/// 名バイプレイヤー - 他のユーザーが作成したタスクを50件完了した
/// </summary>
public class BestSupportingStrategy : AchievementStrategyBase
{
    private const int RequiredCount = 50;

    /// <summary>
    /// <see cref="BestSupportingStrategy"/> クラスの新しいインスタンスを初期化します。
    /// </summary>
    /// <param name="context">データベースコンテキスト。</param>
    /// <param name="logger">ロガー。</param>
    public BestSupportingStrategy(ApplicationDbContext context, ILogger<BestSupportingStrategy> logger)
        : base(context, logger)
    {
    }

    /// <inheritdoc/>
    public override string AchievementCode => "BEST_SUPPORTING";

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
            .Where(t => t.CompletedByUserId != null)
            .Select(t => new
            {
                CompletedByUserId = t.CompletedByUserId!.Value,
                t.CreatedByUserId
            })
            .ToListAsync(cancellationToken);

        var bestSupportingUserIds = completedTasks
            .Where(t => t.CompletedByUserId != t.CreatedByUserId)
            .GroupBy(t => t.CompletedByUserId)
            .Where(g => g.Count() >= RequiredCount)
            .OrderBy(g => g.Key)
            .Select(g => g.Key)
            .Take(MaxResultsPerEvaluation)
            .ToList();

        Logger.LogDebug(
            "BestSupporting evaluation for org {OrganizationId}: {Count} users qualified",
            organizationId,
            bestSupportingUserIds.Count);

        return bestSupportingUserIds;
    }
}