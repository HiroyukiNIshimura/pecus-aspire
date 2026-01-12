using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.DB;

namespace Pecus.Libs.Achievements.Strategies;

/// <summary>
/// 期限厳守の達人 - 期限付きタスクを10件連続で期限内に完了した
/// </summary>
public class DeadlineMasterStrategy : AchievementStrategyBase
{
    private const int RequiredStreak = 10;

    /// <summary>
    /// <see cref="DeadlineMasterStrategy"/> クラスの新しいインスタンスを初期化します。
    /// </summary>
    /// <param name="context">データベースコンテキスト。</param>
    /// <param name="logger">ロガー。</param>
    public DeadlineMasterStrategy(ApplicationDbContext context, ILogger<DeadlineMasterStrategy> logger)
        : base(context, logger)
    {
    }

    /// <inheritdoc/>
    public override string AchievementCode => "DEADLINE_MASTER";

    /// <inheritdoc/>
    public override async Task<IEnumerable<int>> EvaluateAsync(
        int organizationId,
        DateTimeOffset evaluationDate,
        CancellationToken cancellationToken = default)
    {
        var completedTasksWithDueDate = await Context.WorkspaceTasks
            .AsNoTracking()
            .Where(t => t.OrganizationId == organizationId)
            .Where(t => t.IsCompleted)
            .Where(t => t.CompletedAt != null)
            .OrderByDescending(t => t.CompletedAt)
            .Select(t => new
            {
                t.AssignedUserId,
                CompletedAt = t.CompletedAt!.Value,
                t.DueDate
            })
            .ToListAsync(cancellationToken);

        var qualifiedUsers = new List<int>();

        foreach (var group in completedTasksWithDueDate.GroupBy(t => t.AssignedUserId))
        {
            var streak = 0;

            foreach (var task in group.OrderByDescending(t => t.CompletedAt))
            {
                if (task.CompletedAt.Date <= task.DueDate.Date)
                {
                    streak++;
                    if (streak >= RequiredStreak)
                    {
                        qualifiedUsers.Add(group.Key);
                        break;
                    }
                }
                else
                {
                    break;
                }
            }
        }

        Logger.LogDebug(
            "DeadlineMaster evaluation for org {OrganizationId}: {Count} users qualified",
            organizationId,
            qualifiedUsers.Count);

        return qualifiedUsers.Distinct().Take(MaxResultsPerEvaluation);
    }
}
