using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.DB;

namespace Pecus.Libs.Achievements.Strategies;

/// <summary>
/// Inbox Zero - 担当タスクをすべて完了した状態で1日を終えた
/// </summary>
public class InboxZeroStrategy : AchievementStrategyBase
{
    /// <summary>
    /// <see cref="InboxZeroStrategy"/> クラスの新しいインスタンスを初期化します。
    /// </summary>
    /// <param name="context">データベースコンテキスト。</param>
    /// <param name="logger">ロガー。</param>
    public InboxZeroStrategy(ApplicationDbContext context, ILogger<InboxZeroStrategy> logger)
        : base(context, logger)
    {
    }

    /// <inheritdoc/>
    public override string AchievementCode => "INBOX_ZERO";

    /// <inheritdoc/>
    public override async Task<IEnumerable<int>> EvaluateAsync(
        int organizationId,
        DateTimeOffset evaluationDate,
        CancellationToken cancellationToken = default)
    {
        // 未完了タスクを持つユーザーを取得
        var usersWithIncompleteTasks = await Context.WorkspaceTasks
            .AsNoTracking()
            .Where(t => t.OrganizationId == organizationId)
            .Where(t => !t.IsCompleted && !t.IsDiscarded)
            .Select(t => t.AssignedUserId)
            .Distinct()
            .ToListAsync(cancellationToken);

        // 完了済みタスクを持ち、かつ未完了タスクがないユーザーを取得
        var inboxZeroUserIds = await Context.WorkspaceTasks
            .AsNoTracking()
            .Where(t => t.OrganizationId == organizationId)
            .Where(t => t.IsCompleted)
            .Where(t => !usersWithIncompleteTasks.Contains(t.AssignedUserId))
            .Select(t => t.AssignedUserId)
            .Distinct()
            .OrderBy(userId => userId)
            .Take(MaxResultsPerEvaluation)
            .ToListAsync(cancellationToken);

        Logger.LogDebug(
            "InboxZero evaluation for org {OrganizationId}: {Count} users qualified",
            organizationId,
            inboxZeroUserIds.Count);

        return inboxZeroUserIds;
    }
}