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
        var activeUsers = await Context.Users
            .AsNoTracking()
            .Where(u => u.OrganizationId == organizationId && u.IsActive)
            .Select(u => u.Id)
            .ToListAsync(cancellationToken);

        if (activeUsers.Count == 0)
        {
            return [];
        }

        var usersWithIncompleteTasks = await Context.WorkspaceTasks
            .AsNoTracking()
            .Where(t => t.OrganizationId == organizationId)
            .Where(t => !t.IsCompleted && !t.IsDiscarded)
            .Select(t => t.AssignedUserId)
            .Distinct()
            .ToListAsync(cancellationToken);

        var inboxZeroUserIds = activeUsers
            .Where(userId => !usersWithIncompleteTasks.Contains(userId))
            .ToList();

        Logger.LogDebug(
            "InboxZero evaluation for org {OrganizationId}: {Count} users qualified",
            organizationId,
            inboxZeroUserIds.Count);

        return inboxZeroUserIds;
    }
}
