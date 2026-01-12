using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.DB;

namespace Pecus.Libs.Achievements.Strategies;

/// <summary>
/// 連続達成 - 7日連続でタスクを完了した
/// </summary>
public class StreakMasterStrategy : AchievementStrategyBase
{
    private const int RequiredDays = 7;
    private const string DefaultTimeZone = "Asia/Tokyo";

    /// <summary>
    /// <see cref="StreakMasterStrategy"/> クラスの新しいインスタンスを初期化します。
    /// </summary>
    /// <param name="context">データベースコンテキスト。</param>
    /// <param name="logger">ロガー。</param>
    public StreakMasterStrategy(ApplicationDbContext context, ILogger<StreakMasterStrategy> logger)
        : base(context, logger)
    {
    }

    /// <inheritdoc/>
    public override string AchievementCode => "STREAK_MASTER";

    /// <inheritdoc/>
    public override async Task<IEnumerable<int>> EvaluateAsync(
        int organizationId,
        DateTimeOffset evaluationDate,
        CancellationToken cancellationToken = default)
    {
        var lookbackDays = RequiredDays + 30;

        var completions = await Context.WorkspaceTasks
            .AsNoTracking()
            .Where(t => t.OrganizationId == organizationId)
            .Where(t => t.IsCompleted)
            .Where(t => t.CompletedAt != null)
            .Where(t => t.CompletedAt >= evaluationDate.AddDays(-lookbackDays))
            .Select(t => new { t.AssignedUserId, CompletedAt = t.CompletedAt!.Value })
            .ToListAsync(cancellationToken);

        var qualifiedUsers = new List<int>();

        foreach (var userGroup in completions.GroupBy(c => c.AssignedUserId))
        {
            var activeDates = userGroup
                .Select(c => ConvertToLocalTime(c.CompletedAt, DefaultTimeZone).Date)
                .Distinct()
                .OrderByDescending(d => d)
                .ToList();

            var maxStreak = CalculateMaxStreak(activeDates);

            if (maxStreak >= RequiredDays)
            {
                qualifiedUsers.Add(userGroup.Key);
            }
        }

        Logger.LogDebug(
            "StreakMaster evaluation for org {OrganizationId}: {Count} users qualified",
            organizationId,
            qualifiedUsers.Count);

        return qualifiedUsers.Take(MaxResultsPerEvaluation);
    }

    private static int CalculateMaxStreak(List<DateTime> sortedDates)
    {
        if (sortedDates.Count == 0) return 0;

        var maxStreak = 1;
        var currentStreak = 1;

        for (var i = 1; i < sortedDates.Count; i++)
        {
            var diff = (sortedDates[i - 1] - sortedDates[i]).Days;

            if (diff == 1)
            {
                currentStreak++;
                maxStreak = Math.Max(maxStreak, currentStreak);
            }
            else if (diff > 1)
            {
                currentStreak = 1;
            }
        }

        return maxStreak;
    }
}
