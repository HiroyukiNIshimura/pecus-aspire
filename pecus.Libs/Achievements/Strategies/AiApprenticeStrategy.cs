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
        // AI チャットルームでユーザーがメッセージを送信した = AI を使用した
        var aiUserIds = await Context.ChatMessages
            .AsNoTracking()
            .Where(m => m.ChatRoom.OrganizationId == organizationId)
            .Where(m => m.ChatRoom.Type == DB.Models.Enums.ChatRoomType.Ai)
            .Where(m => m.SenderActor != null && m.SenderActor.UserId != null)
            .Select(m => m.SenderActor!.UserId!.Value)
            .Distinct()
            .OrderBy(userId => userId)
            .Take(MaxResultsPerEvaluation)
            .ToListAsync(cancellationToken);

        Logger.LogDebug(
            "AiApprentice evaluation for org {OrganizationId}: {Count} users qualified",
            organizationId,
            aiUserIds.Count);

        return aiUserIds;
    }
}
