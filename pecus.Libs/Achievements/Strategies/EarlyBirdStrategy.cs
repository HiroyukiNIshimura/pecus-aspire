using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.DB;

namespace Pecus.Libs.Achievements.Strategies;

/// <summary>
/// 暁の開拓者 - 午前5時～7時の間にタスクを完了した
/// </summary>
public class EarlyBirdStrategy : AchievementStrategyBase
{
    private const int StartHour = 5;
    private const int EndHour = 7;
    private const string DefaultTimeZone = "Asia/Tokyo";

    /// <summary>
    /// <see cref="EarlyBirdStrategy"/> クラスの新しいインスタンスを初期化します。
    /// </summary>
    /// <param name="context">データベースコンテキスト。</param>
    /// <param name="logger">ロガー。</param>
    public EarlyBirdStrategy(ApplicationDbContext context, ILogger<EarlyBirdStrategy> logger)
        : base(context, logger)
    {
    }

    /// <inheritdoc/>
    public override string AchievementCode => "EARLY_BIRD";

    /// <inheritdoc/>
    public override async Task<IEnumerable<int>> EvaluateAsync(
        int organizationId,
        DateTimeOffset evaluationDate,
        CancellationToken cancellationToken = default)
    {
        var localDate = ConvertToLocalTime(evaluationDate, DefaultTimeZone).Date;
        var startOfDay = new DateTimeOffset(localDate, TimeSpan.Zero);
        var endOfDay = startOfDay.AddDays(1);

        var completedTasks = await Context.WorkspaceTasks
            .AsNoTracking()
            .Where(t => t.OrganizationId == organizationId)
            .Where(t => t.IsCompleted)
            .Where(t => t.CompletedAt != null)
            .Where(t => t.CompletedAt >= startOfDay.AddHours(-12) && t.CompletedAt < endOfDay.AddHours(12))
            .Select(t => new { t.AssignedUserId, CompletedAt = t.CompletedAt!.Value })
            .ToListAsync(cancellationToken);

        var earlyBirdUserIds = completedTasks
            .Where(t =>
            {
                var localTime = ConvertToLocalTime(t.CompletedAt, DefaultTimeZone);
                var hour = localTime.Hour;
                return hour >= StartHour && hour < EndHour;
            })
            .Select(t => t.AssignedUserId)
            .Distinct()
            .ToList();

        Logger.LogDebug(
            "EarlyBird evaluation for org {OrganizationId}: {Count} users qualified",
            organizationId,
            earlyBirdUserIds.Count);

        return earlyBirdUserIds;
    }
}
