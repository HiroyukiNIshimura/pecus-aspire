using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.DB;

namespace Pecus.Libs.Achievements.Strategies;

/// <summary>
/// 前倒しマスター - 期限より3日以上前に完了したタスクが10件以上
/// </summary>
public class AheadOfScheduleStrategy : AchievementStrategyBase
{
    private const int RequiredCount = 10;
    private const int DaysAhead = 3;

    /// <summary>
    /// <see cref="AheadOfScheduleStrategy"/> クラスの新しいインスタンスを初期化します。
    /// </summary>
    /// <param name="context">データベースコンテキスト。</param>
    /// <param name="logger">ロガー。</param>
    public AheadOfScheduleStrategy(ApplicationDbContext context, ILogger<AheadOfScheduleStrategy> logger)
        : base(context, logger)
    {
    }

    /// <inheritdoc/>
    public override string AchievementCode => "AHEAD_OF_SCHEDULE";

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
            .Where(t => t.CompletedByUserId != null)
            .Select(t => new
            {
                CompletedByUserId = t.CompletedByUserId!.Value,
                CompletedAt = t.CompletedAt!.Value,
                t.DueDate
            })
            .ToListAsync(cancellationToken);

        var aheadOfScheduleUserIds = completedTasks
            .Where(t => (t.DueDate.Date - t.CompletedAt.Date).TotalDays >= DaysAhead)
            .GroupBy(t => t.CompletedByUserId)
            .Where(g => g.Count() >= RequiredCount)
            .OrderBy(g => g.Key)
            .Select(g => g.Key)
            .Take(MaxResultsPerEvaluation)
            .ToList();

        Logger.LogDebug(
            "AheadOfSchedule evaluation for org {OrganizationId}: {Count} users qualified",
            organizationId,
            aheadOfScheduleUserIds.Count);

        return aheadOfScheduleUserIds;
    }
}