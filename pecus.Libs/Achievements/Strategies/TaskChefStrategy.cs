using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.DB;

namespace Pecus.Libs.Achievements.Strategies;

/// <summary>
/// タスク料理人 - 1日で5件以上のタスクを作成した
/// </summary>
public class TaskChefStrategy : AchievementStrategyBase
{
    private const int RequiredCount = 5;
    private const string DefaultTimeZone = "Asia/Tokyo";

    /// <summary>
    /// <see cref="TaskChefStrategy"/> クラスの新しいインスタンスを初期化します。
    /// </summary>
    /// <param name="context">データベースコンテキスト。</param>
    /// <param name="logger">ロガー。</param>
    public TaskChefStrategy(ApplicationDbContext context, ILogger<TaskChefStrategy> logger)
        : base(context, logger)
    {
    }

    /// <inheritdoc/>
    public override string AchievementCode => "TASK_CHEF";

    /// <inheritdoc/>
    public override async Task<IEnumerable<int>> EvaluateAsync(
        int organizationId,
        DateTimeOffset evaluationDate,
        CancellationToken cancellationToken = default)
    {
        var localDate = ConvertToLocalTime(evaluationDate, DefaultTimeZone).Date;
        var startOfDay = new DateTimeOffset(localDate, TimeSpan.Zero);
        var endOfDay = startOfDay.AddDays(1);

        var taskChefUserIds = await Context.WorkspaceTasks
            .AsNoTracking()
            .Where(t => t.OrganizationId == organizationId)
            .Where(t => t.CreatedAt >= startOfDay.AddHours(-12) && t.CreatedAt < endOfDay.AddHours(12))
            .GroupBy(t => t.CreatedByUserId)
            .Where(g => g.Count() >= RequiredCount)
            .Select(g => g.Key)
            .Take(MaxResultsPerEvaluation)
            .ToListAsync(cancellationToken);

        Logger.LogDebug(
            "TaskChef evaluation for org {OrganizationId}: {Count} users qualified",
            organizationId,
            taskChefUserIds.Count);

        return taskChefUserIds;
    }
}
