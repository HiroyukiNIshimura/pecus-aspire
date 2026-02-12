using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.DB;

namespace Pecus.Libs.Achievements.Strategies;

/// <summary>
/// 初投稿 - 初めてタスクを作成した
/// </summary>
public class FirstPostStrategy : AchievementStrategyBase
{
    /// <summary>
    /// <see cref="FirstPostStrategy"/> クラスの新しいインスタンスを初期化します。
    /// </summary>
    /// <param name="context">データベースコンテキスト。</param>
    /// <param name="logger">ロガー。</param>
    public FirstPostStrategy(ApplicationDbContext context, ILogger<FirstPostStrategy> logger)
        : base(context, logger)
    {
    }

    /// <inheritdoc/>
    public override string AchievementCode => "FIRST_POST";

    /// <inheritdoc/>
    public override async Task<IEnumerable<int>> EvaluateAsync(
        int organizationId,
        DateTimeOffset evaluationDate,
        CancellationToken cancellationToken = default)
    {
        // タスクを1件以上作成したユーザーを取得
        var firstPostUserIds = await Context.WorkspaceTasks
            .AsNoTracking()
            .Where(t => t.OrganizationId == organizationId)
            .Select(t => t.CreatedByUserId)
            .Distinct()
            .OrderBy(userId => userId)
            .Take(MaxResultsPerEvaluation)
            .ToListAsync(cancellationToken);

        Logger.LogDebug(
            "FirstPost evaluation for org {OrganizationId}: {Count} users qualified",
            organizationId,
            firstPostUserIds.Count);

        return firstPostUserIds;
    }
}