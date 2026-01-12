using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.DB;

namespace Pecus.Libs.Achievements.Strategies;

/// <summary>
/// コメンテーター - タスクにコメントを50件投稿した
/// </summary>
public class CommentatorStrategy : AchievementStrategyBase
{
    private const int RequiredCount = 50;

    /// <summary>
    /// <see cref="CommentatorStrategy"/> クラスの新しいインスタンスを初期化します。
    /// </summary>
    /// <param name="context">データベースコンテキスト。</param>
    /// <param name="logger">ロガー。</param>
    public CommentatorStrategy(ApplicationDbContext context, ILogger<CommentatorStrategy> logger)
        : base(context, logger)
    {
    }

    /// <inheritdoc/>
    public override string AchievementCode => "COMMENTATOR";

    /// <inheritdoc/>
    public override async Task<IEnumerable<int>> EvaluateAsync(
        int organizationId,
        DateTimeOffset evaluationDate,
        CancellationToken cancellationToken = default)
    {
        var commentatorUserIds = await Context.TaskComments
            .AsNoTracking()
            .Where(tc => tc.WorkspaceTask != null && tc.WorkspaceTask.OrganizationId == organizationId)
            .GroupBy(tc => tc.UserId)
            .Where(g => g.Count() >= RequiredCount)
            .OrderBy(g => g.Key)
            .Select(g => g.Key)
            .Take(MaxResultsPerEvaluation)
            .ToListAsync(cancellationToken);

        Logger.LogDebug(
            "Commentator evaluation for org {OrganizationId}: {Count} users qualified",
            organizationId,
            commentatorUserIds.Count);

        return commentatorUserIds;
    }
}
