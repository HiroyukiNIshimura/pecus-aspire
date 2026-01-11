using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.DB;

namespace Pecus.Libs.Achievements.Strategies;

/// <summary>
/// AI使いの弟子 - AIアシスタント機能を使用した（Botにメッセージを送信した）
/// </summary>
public class AiApprenticeStrategy : AchievementStrategyBase
{
    /// <summary>
    /// <see cref="AiApprenticeStrategy"/> クラスの新しいインスタンスを初期化します。
    /// </summary>
    /// <param name="context">データベースコンテキスト。</param>
    /// <param name="logger">ロガー。</param>
    public AiApprenticeStrategy(ApplicationDbContext context, ILogger<AiApprenticeStrategy> logger)
        : base(context, logger)
    {
    }

    /// <inheritdoc/>
    public override string AchievementCode => "AI_APPRENTICE";

    /// <inheritdoc/>
    public override async Task<IEnumerable<int>> EvaluateAsync(
        int organizationId,
        DateTimeOffset evaluationDate,
        CancellationToken cancellationToken = default)
    {
        var workspaceIds = await Context.Workspaces
            .AsNoTracking()
            .Where(w => w.OrganizationId == organizationId)
            .Select(w => w.Id)
            .ToListAsync(cancellationToken);

        if (workspaceIds.Count == 0)
        {
            return [];
        }

        var aiUserIds = await Context.ChatMessages
            .AsNoTracking()
            .Where(m => m.ChatRoom != null && m.ChatRoom.WorkspaceId != null &&
                        workspaceIds.Contains(m.ChatRoom.WorkspaceId.Value))
            .Where(m => m.SenderActor != null && m.SenderActor.BotId != null)
            .Where(m => m.SenderActorId != null)
            .Select(m => m.SenderActor!.UserId)
            .Where(userId => userId != null)
            .Select(userId => userId!.Value)
            .Distinct()
            .ToListAsync(cancellationToken);

        Logger.LogDebug(
            "AiApprentice evaluation for org {OrganizationId}: {Count} users qualified",
            organizationId,
            aiUserIds.Count);

        return aiUserIds;
    }
}
