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
    /// <remarks>
    /// 過去全期間のタスク作成を評価し、1日で5件以上作成した日があるユーザーを抽出します。
    /// 既にバッジを獲得しているユーザーの除外は AchievementEvaluator が担当します。
    /// </remarks>
    public override async Task<IEnumerable<int>> EvaluateAsync(
        int organizationId,
        DateTimeOffset evaluationDate,
        CancellationToken cancellationToken = default)
    {
        // 過去全期間のタスク作成を取得
        var allTasks = await Context.WorkspaceTasks
            .AsNoTracking()
            .Where(t => t.OrganizationId == organizationId)
            .Select(t => new { t.CreatedByUserId, t.CreatedAt })
            .ToListAsync(cancellationToken);

        // ユーザーごとに日付別でグループ化し、1日に5件以上作成した日があるか判定
        var taskChefUserIds = allTasks
            .GroupBy(t => t.CreatedByUserId)
            .Where(userGroup => userGroup
                .GroupBy(t => ConvertToLocalTime(t.CreatedAt, DefaultTimeZone).Date)
                .Any(dateGroup => dateGroup.Count() >= RequiredCount))
            .Select(g => g.Key)
            .OrderBy(userId => userId)
            .Take(MaxResultsPerEvaluation)
            .ToList();

        Logger.LogDebug(
            "TaskChef evaluation for org {OrganizationId}: {Count} users qualified",
            organizationId,
            taskChefUserIds.Count);

        return taskChefUserIds;
    }
}
