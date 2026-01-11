using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.DB;

namespace Pecus.Libs.Achievements.Strategies;

/// <summary>
/// パーフェクトウィーク - 1週間で全タスクを期限内に完了した（最低5件以上）
/// </summary>
public class PerfectWeekStrategy : AchievementStrategyBase
{
    private const int MinimumTasks = 5;
    private const string DefaultTimeZone = "Asia/Tokyo";

    /// <summary>
    /// <see cref="PerfectWeekStrategy"/> クラスの新しいインスタンスを初期化します。
    /// </summary>
    /// <param name="context">データベースコンテキスト。</param>
    /// <param name="logger">ロガー。</param>
    public PerfectWeekStrategy(ApplicationDbContext context, ILogger<PerfectWeekStrategy> logger)
        : base(context, logger)
    {
    }

    /// <inheritdoc/>
    public override string AchievementCode => "PERFECT_WEEK";

    /// <inheritdoc/>
    public override async Task<IEnumerable<int>> EvaluateAsync(
        int organizationId,
        DateTimeOffset evaluationDate,
        CancellationToken cancellationToken = default)
    {
        var localDate = ConvertToLocalTime(evaluationDate, DefaultTimeZone).Date;

        var daysToSubtract = ((int)localDate.DayOfWeek + 6) % 7;
        var weekStart = localDate.AddDays(-daysToSubtract);
        var weekEnd = weekStart.AddDays(7);

        var completionsThisWeek = await Context.WorkspaceTasks
            .AsNoTracking()
            .Where(t => t.OrganizationId == organizationId)
            .Where(t => t.IsCompleted)
            .Where(t => t.CompletedAt != null)
            .Where(t => t.CompletedAt >= new DateTimeOffset(weekStart, TimeSpan.Zero).AddHours(-12))
            .Where(t => t.CompletedAt < new DateTimeOffset(weekEnd, TimeSpan.Zero).AddHours(12))
            .Select(t => new
            {
                t.AssignedUserId,
                CompletedAt = t.CompletedAt!.Value,
                t.DueDate
            })
            .ToListAsync(cancellationToken);

        var qualifiedUsers = new List<int>();

        foreach (var userGroup in completionsThisWeek.GroupBy(c => c.AssignedUserId))
        {
            var weekCompletions = userGroup
                .Where(c =>
                {
                    var localCompletedAt = ConvertToLocalTime(c.CompletedAt, DefaultTimeZone).Date;
                    return localCompletedAt >= weekStart && localCompletedAt < weekEnd;
                })
                .ToList();

            if (weekCompletions.Count >= MinimumTasks &&
                weekCompletions.All(c => c.CompletedAt.Date <= c.DueDate.Date))
            {
                qualifiedUsers.Add(userGroup.Key);
            }
        }

        Logger.LogDebug(
            "PerfectWeek evaluation for org {OrganizationId}: {Count} users qualified",
            organizationId,
            qualifiedUsers.Count);

        return qualifiedUsers;
    }
}
