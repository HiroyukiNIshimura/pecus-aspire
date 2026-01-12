using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.DB;

namespace Pecus.Libs.Achievements.Strategies;

/// <summary>
/// コネクター - 5つ以上のワークスペースに参加している
/// </summary>
public class ConnectorStrategy : AchievementStrategyBase
{
    private const int RequiredCount = 5;

    /// <summary>
    /// <see cref="ConnectorStrategy"/> クラスの新しいインスタンスを初期化します。
    /// </summary>
    /// <param name="context">データベースコンテキスト。</param>
    /// <param name="logger">ロガー。</param>
    public ConnectorStrategy(ApplicationDbContext context, ILogger<ConnectorStrategy> logger)
        : base(context, logger)
    {
    }

    /// <inheritdoc/>
    public override string AchievementCode => "CONNECTOR";

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

        var connectorUserIds = await Context.WorkspaceUsers
            .AsNoTracking()
            .Where(wu => activeUsers.Contains(wu.UserId))
            .GroupBy(wu => wu.UserId)
            .Where(g => g.Count() >= RequiredCount)
            .Select(g => g.Key)
            .Take(MaxResultsPerEvaluation)
            .ToListAsync(cancellationToken);

        Logger.LogDebug(
            "Connector evaluation for org {OrganizationId}: {Count} users qualified",
            organizationId,
            connectorUserIds.Count);

        return connectorUserIds;
    }
}
