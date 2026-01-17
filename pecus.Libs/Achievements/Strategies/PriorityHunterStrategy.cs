using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models.Enums;

namespace Pecus.Libs.Achievements.Strategies;

/// <summary>
/// 高優先度ハンター - 高優先度タスクを5件完了した
/// </summary>
public class PriorityHunterStrategy : AchievementStrategyBase
{
    private const int RequiredCount = 5;

    /// <summary>
    /// <see cref="PriorityHunterStrategy"/> クラスの新しいインスタンスを初期化します。
    /// </summary>
    /// <param name="context">データベースコンテキスト。</param>
    /// <param name="logger">ロガー。</param>
    public PriorityHunterStrategy(ApplicationDbContext context, ILogger<PriorityHunterStrategy> logger)
        : base(context, logger)
    {
    }

    /// <inheritdoc/>
    public override string AchievementCode => "PRIORITY_HUNTER";

    /// <inheritdoc/>
    public override async Task<IEnumerable<int>> EvaluateAsync(
        int organizationId,
        DateTimeOffset evaluationDate,
        CancellationToken cancellationToken = default)
    {
        var priorityHunterUserIds = await Context.WorkspaceTasks
            .AsNoTracking()
            .Where(t => t.OrganizationId == organizationId)
            .Where(t => t.IsCompleted)
            .Where(t => t.Priority == TaskPriority.High)
            .Where(t => t.CompletedByUserId != null)
            .GroupBy(t => t.CompletedByUserId!.Value)
            .Where(g => g.Count() >= RequiredCount)
            .OrderBy(g => g.Key)
            .Select(g => g.Key)
            .Take(MaxResultsPerEvaluation)
            .ToListAsync(cancellationToken);

        Logger.LogDebug(
            "PriorityHunter evaluation for org {OrganizationId}: {Count} users qualified",
            organizationId,
            priorityHunterUserIds.Count);

        return priorityHunterUserIds;
    }
}
