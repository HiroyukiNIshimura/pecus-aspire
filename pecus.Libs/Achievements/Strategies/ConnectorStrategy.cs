using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.DB;

namespace Pecus.Libs.Achievements.Strategies;

/// <summary>
/// コネクター - アイテム間の関連を10件以上作成した
/// </summary>
public class ConnectorStrategy : AchievementStrategyBase
{
    private const int RequiredCount = 10;

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
        // ユーザーが作成したアイテム間の関連数をカウント
        // Note: WorkspaceItemRelation は FromItem に紐づくため、
        // 厳密には FromItem.OrganizationId == organizationId のチェックが望ましいが、
        // リソース最適化のため、ひとまずリレーション自体の作成者を見る。
        // （組織をまたぐリレーションは基本的にはない前提）

        var connectorUserIds = await Context.WorkspaceItemRelations
            .AsNoTracking()
            .Where(r => r.FromItem!.Workspace!.OrganizationId == organizationId)
            .GroupBy(r => r.CreatedByUserId)
            .Where(g => g.Count() >= RequiredCount)
            .OrderBy(g => g.Key)
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
