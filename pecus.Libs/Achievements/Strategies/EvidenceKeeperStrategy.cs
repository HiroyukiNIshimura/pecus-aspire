using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.DB;

namespace Pecus.Libs.Achievements.Strategies;

/// <summary>
/// 証拠を残す人 - ファイル添付付きでタスクを完了した回数が20件以上
/// </summary>
public class EvidenceKeeperStrategy : AchievementStrategyBase
{
    private const int RequiredCount = 20;

    /// <summary>
    /// <see cref="EvidenceKeeperStrategy"/> クラスの新しいインスタンスを初期化します。
    /// </summary>
    /// <param name="context">データベースコンテキスト。</param>
    /// <param name="logger">ロガー。</param>
    public EvidenceKeeperStrategy(ApplicationDbContext context, ILogger<EvidenceKeeperStrategy> logger)
        : base(context, logger)
    {
    }

    /// <inheritdoc/>
    public override string AchievementCode => "EVIDENCE_KEEPER";

    /// <inheritdoc/>
    public override async Task<IEnumerable<int>> EvaluateAsync(
        int organizationId,
        DateTimeOffset evaluationDate,
        CancellationToken cancellationToken = default)
    {
        var itemsWithAttachments = await Context.WorkspaceItemAttachments
            .AsNoTracking()
            .Where(a => a.WorkspaceItem != null && a.WorkspaceItem.Workspace != null &&
                        a.WorkspaceItem.Workspace.OrganizationId == organizationId)
            .Select(a => a.WorkspaceItemId)
            .Distinct()
            .ToListAsync(cancellationToken);

        if (itemsWithAttachments.Count == 0)
        {
            return [];
        }

        var evidenceKeeperUserIds = await Context.WorkspaceTasks
            .AsNoTracking()
            .Where(t => t.OrganizationId == organizationId)
            .Where(t => t.IsCompleted)
            .Where(t => itemsWithAttachments.Contains(t.WorkspaceItemId))
            .GroupBy(t => t.AssignedUserId)
            .Where(g => g.Count() >= RequiredCount)
            .Select(g => g.Key)
            .Take(MaxResultsPerEvaluation)
            .ToListAsync(cancellationToken);

        Logger.LogDebug(
            "EvidenceKeeper evaluation for org {OrganizationId}: {Count} users qualified",
            organizationId,
            evidenceKeeperUserIds.Count);

        return evidenceKeeperUserIds;
    }
}
