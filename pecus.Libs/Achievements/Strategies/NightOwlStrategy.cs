using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.DB;

namespace Pecus.Libs.Achievements.Strategies;

/// <summary>
/// 夜更かしの棟 - 午後10時～午前2時の間にタスクを完了した
/// </summary>
public class NightOwlStrategy : AchievementStrategyBase
{
    private const int StartHour = 22;
    private const int EndHour = 2;
    private const string DefaultTimeZone = "Asia/Tokyo";

    /// <summary>
    /// <see cref="NightOwlStrategy"/> クラスの新しいインスタンスを初期化します。
    /// </summary>
    /// <param name="context">データベースコンテキスト。</param>
    /// <param name="logger">ロガー。</param>
    public NightOwlStrategy(ApplicationDbContext context, ILogger<NightOwlStrategy> logger)
        : base(context, logger)
    {
    }

    /// <inheritdoc/>
    public override string AchievementCode => "NIGHT_OWL";

    /// <inheritdoc/>
    public override async Task<IEnumerable<int>> EvaluateAsync(
        int organizationId,
        DateTimeOffset evaluationDate,
        CancellationToken cancellationToken = default)
    {
        var localDate = ConvertToLocalTime(evaluationDate, DefaultTimeZone).Date;
        var startTime = new DateTimeOffset(localDate.AddHours(StartHour), TimeSpan.Zero);
        var endTime = new DateTimeOffset(localDate.AddDays(1).AddHours(EndHour), TimeSpan.Zero);

        var completedTasks = await Context.WorkspaceTasks
            .AsNoTracking()
            .Where(t => t.OrganizationId == organizationId)
            .Where(t => t.IsCompleted)
            .Where(t => t.CompletedAt != null)
            .Where(t => t.CompletedAt >= startTime.AddHours(-12) && t.CompletedAt < endTime.AddHours(12))
            .Select(t => new { t.AssignedUserId, CompletedAt = t.CompletedAt!.Value })
            .ToListAsync(cancellationToken);

        var nightOwlUserIds = completedTasks
            .Where(t =>
            {
                var localTime = ConvertToLocalTime(t.CompletedAt, DefaultTimeZone);
                var hour = localTime.Hour;
                return hour >= StartHour || hour < EndHour;
            })
            .Select(t => t.AssignedUserId)
            .Distinct()
            .Take(MaxResultsPerEvaluation)
            .ToList();

        Logger.LogDebug(
            "NightOwl evaluation for org {OrganizationId}: {Count} users qualified",
            organizationId,
            nightOwlUserIds.Count);

        return nightOwlUserIds;
    }
}
