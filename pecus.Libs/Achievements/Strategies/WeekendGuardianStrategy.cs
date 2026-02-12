using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.DB;

namespace Pecus.Libs.Achievements.Strategies;

/// <summary>
/// 週末の聖域 - 週末にタスクを完了した（土日判定は組織タイムゾーン基準）
/// </summary>
public class WeekendGuardianStrategy : AchievementStrategyBase
{
    private const string DefaultTimeZone = "Asia/Tokyo";

    /// <summary>
    /// <see cref="WeekendGuardianStrategy"/> クラスの新しいインスタンスを初期化します。
    /// </summary>
    /// <param name="context">データベースコンテキスト。</param>
    /// <param name="logger">ロガー。</param>
    public WeekendGuardianStrategy(ApplicationDbContext context, ILogger<WeekendGuardianStrategy> logger)
        : base(context, logger)
    {
    }

    /// <inheritdoc/>
    public override string AchievementCode => "WEEKEND_GUARDIAN";

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
            .Select(t => new { CompletedByUserId = t.CompletedByUserId!.Value, CompletedAt = t.CompletedAt!.Value })
            .ToListAsync(cancellationToken);

        var weekendUserIds = completedTasks
            .Where(t =>
            {
                var localTime = ConvertToLocalTime(t.CompletedAt, DefaultTimeZone);
                return localTime.DayOfWeek == DayOfWeek.Saturday || localTime.DayOfWeek == DayOfWeek.Sunday;
            })
            .Select(t => t.CompletedByUserId)
            .Distinct()
            .OrderBy(userId => userId)
            .Take(MaxResultsPerEvaluation)
            .ToList();

        Logger.LogDebug(
            "WeekendGuardian evaluation for org {OrganizationId}: {Count} users qualified",
            organizationId,
            weekendUserIds.Count);

        return weekendUserIds;
    }
}