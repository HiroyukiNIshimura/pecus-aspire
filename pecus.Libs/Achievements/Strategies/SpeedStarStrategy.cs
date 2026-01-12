using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.DB;

namespace Pecus.Libs.Achievements.Strategies;

/// <summary>
/// スピードスター - 作成から24時間以内にタスクを完了した（10件以上）
/// </summary>
public class SpeedStarStrategy : AchievementStrategyBase
{
    private const int RequiredCount = 10;
    private const int MaxHours = 24;

    /// <summary>
    /// <see cref="SpeedStarStrategy"/> クラスの新しいインスタンスを初期化します。
    /// </summary>
    /// <param name="context">データベースコンテキスト。</param>
    /// <param name="logger">ロガー。</param>
    public SpeedStarStrategy(ApplicationDbContext context, ILogger<SpeedStarStrategy> logger)
        : base(context, logger)
    {
    }

    /// <inheritdoc/>
    public override string AchievementCode => "SPEED_STAR";

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
            .Where(t => t.CompletedAt != null)
            .Select(t => new
            {
                t.AssignedUserId,
                t.CreatedAt,
                CompletedAt = t.CompletedAt!.Value
            })
            .ToListAsync(cancellationToken);

        var speedStarUserIds = completedTasks
            .Where(t => (t.CompletedAt - t.CreatedAt).TotalHours <= MaxHours)
            .GroupBy(t => t.AssignedUserId)
            .Where(g => g.Count() >= RequiredCount)
            .OrderBy(g => g.Key)
            .Select(g => g.Key)
            .Take(MaxResultsPerEvaluation)
            .ToList();

        Logger.LogDebug(
            "SpeedStar evaluation for org {OrganizationId}: {Count} users qualified",
            organizationId,
            speedStarUserIds.Count);

        return speedStarUserIds;
    }
}
