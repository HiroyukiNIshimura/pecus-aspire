using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.DB;

namespace Pecus.Libs.Achievements.Strategies;

/// <summary>
/// ドキュメンター - コメント付きでタスクを20件完了した
/// </summary>
public class DocumenterStrategy : AchievementStrategyBase
{
    private const int RequiredCount = 20;

    /// <summary>
    /// <see cref="DocumenterStrategy"/> クラスの新しいインスタンスを初期化します。
    /// </summary>
    /// <param name="context">データベースコンテキスト。</param>
    /// <param name="logger">ロガー。</param>
    public DocumenterStrategy(ApplicationDbContext context, ILogger<DocumenterStrategy> logger)
        : base(context, logger)
    {
    }

    /// <inheritdoc/>
    public override string AchievementCode => "DOCUMENTER";

    /// <inheritdoc/>
    public override async Task<IEnumerable<int>> EvaluateAsync(
        int organizationId,
        DateTimeOffset evaluationDate,
        CancellationToken cancellationToken = default)
    {
        var tasksWithComments = await Context.TaskComments
            .AsNoTracking()
            .Where(tc => tc.WorkspaceTask != null && tc.WorkspaceTask.OrganizationId == organizationId)
            .Select(tc => tc.WorkspaceTaskId)
            .Distinct()
            .ToListAsync(cancellationToken);

        if (tasksWithComments.Count == 0)
        {
            return [];
        }

        var documentedTaskCreators = await Context.WorkspaceTasks
            .AsNoTracking()
            .Where(t => t.OrganizationId == organizationId)
            .Where(t => t.IsCompleted)
            .Where(t => t.CompletedByUserId != null)
            .Where(t => tasksWithComments.Contains(t.Id))
            .GroupBy(t => t.CompletedByUserId!.Value)
            .Where(g => g.Count() >= RequiredCount)
            .OrderBy(g => g.Key)
            .Select(g => g.Key)
            .Take(MaxResultsPerEvaluation)
            .ToListAsync(cancellationToken);

        Logger.LogDebug(
            "Documenter evaluation for org {OrganizationId}: {Count} users qualified",
            organizationId,
            documentedTaskCreators.Count);

        return documentedTaskCreators;
    }
}
