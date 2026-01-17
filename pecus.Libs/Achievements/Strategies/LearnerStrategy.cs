using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models.Enums;

namespace Pecus.Libs.Achievements.Strategies;

/// <summary>
/// 学習者 - リオープンされたタスクから学び、次の10件は一発で完了した（Activity経由で判定）
/// </summary>
public class LearnerStrategy : AchievementStrategyBase
{
    private const int RequiredStreak = 10;

    /// <summary>
    /// <see cref="LearnerStrategy"/> クラスの新しいインスタンスを初期化します。
    /// </summary>
    /// <param name="context">データベースコンテキスト。</param>
    /// <param name="logger">ロガー。</param>
    public LearnerStrategy(ApplicationDbContext context, ILogger<LearnerStrategy> logger)
        : base(context, logger)
    {
    }

    /// <inheritdoc/>
    public override string AchievementCode => "LEARNER";

    /// <inheritdoc/>
    public override async Task<IEnumerable<int>> EvaluateAsync(
        int organizationId,
        DateTimeOffset evaluationDate,
        CancellationToken cancellationToken = default)
    {
        var workspaceIds = await Context.Workspaces
            .AsNoTracking()
            .Where(w => w.OrganizationId == organizationId)
            .Select(w => w.Id)
            .ToListAsync(cancellationToken);

        if (workspaceIds.Count == 0)
        {
            return [];
        }

        var reopenedActivities = await Context.Activities
            .AsNoTracking()
            .Where(a => workspaceIds.Contains(a.WorkspaceId))
            .Where(a => a.ActionType == ActivityActionType.TaskReopened)
            .Where(a => a.UserId != null)
            .Select(a => new { ItemId = a.ItemId, UserId = a.UserId!.Value, a.CreatedAt })
            .ToListAsync(cancellationToken);

        if (reopenedActivities.Count == 0)
        {
            return [];
        }

        var usersWithReopens = reopenedActivities.Select(r => r.UserId).Distinct().ToList();
        var reopenedItemIdSet = reopenedActivities.Select(r => r.ItemId).ToHashSet();

        var completions = await Context.Activities
            .AsNoTracking()
            .Where(a => workspaceIds.Contains(a.WorkspaceId))
            .Where(a => a.ActionType == ActivityActionType.TaskCompleted)
            .Where(a => a.UserId != null && usersWithReopens.Contains(a.UserId.Value))
            .OrderBy(a => a.CreatedAt)
            .Select(a => new { UserId = a.UserId!.Value, a.ItemId, a.CreatedAt })
            .ToListAsync(cancellationToken);

        var qualifiedUsers = new List<int>();

        foreach (var userReopens in reopenedActivities.GroupBy(r => r.UserId))
        {
            var lastReopenTime = userReopens.Max(r => r.CreatedAt);
            var userCompletions = completions
                .Where(c => c.UserId == userReopens.Key && c.CreatedAt > lastReopenTime)
                .ToList();

            var consecutiveFirstTry = 0;
            foreach (var completion in userCompletions)
            {
                if (!reopenedItemIdSet.Contains(completion.ItemId))
                {
                    consecutiveFirstTry++;
                    if (consecutiveFirstTry >= RequiredStreak)
                    {
                        qualifiedUsers.Add(userReopens.Key);
                        break;
                    }
                }
                else
                {
                    consecutiveFirstTry = 0;
                }
            }
        }

        Logger.LogDebug(
            "Learner evaluation for org {OrganizationId}: {Count} users qualified",
            organizationId,
            qualifiedUsers.Count);

        return qualifiedUsers.Distinct().OrderBy(userId => userId).Take(MaxResultsPerEvaluation);
    }
}
