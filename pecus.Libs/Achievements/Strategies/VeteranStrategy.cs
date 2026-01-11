using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.DB;

namespace Pecus.Libs.Achievements.Strategies;

/// <summary>
/// 古参ユーザー - 登録から1年以上経過したユーザー
/// </summary>
public class VeteranStrategy : AchievementStrategyBase
{
    private const int RequiredDays = 365;

    /// <summary>
    /// <see cref="VeteranStrategy"/> クラスの新しいインスタンスを初期化します。
    /// </summary>
    /// <param name="context">データベースコンテキスト。</param>
    /// <param name="logger">ロガー。</param>
    public VeteranStrategy(ApplicationDbContext context, ILogger<VeteranStrategy> logger)
        : base(context, logger)
    {
    }

    /// <inheritdoc/>
    public override string AchievementCode => "VETERAN";

    /// <inheritdoc/>
    public override async Task<IEnumerable<int>> EvaluateAsync(
        int organizationId,
        DateTimeOffset evaluationDate,
        CancellationToken cancellationToken = default)
    {
        var thresholdDate = evaluationDate.AddDays(-RequiredDays);

        var veteranUserIds = await Context.Users
            .AsNoTracking()
            .Where(u => u.OrganizationId == organizationId)
            .Where(u => u.CreatedAt <= thresholdDate)
            .Where(u => u.IsActive)
            .Select(u => u.Id)
            .ToListAsync(cancellationToken);

        Logger.LogDebug(
            "Veteran evaluation for org {OrganizationId}: {Count} users qualified",
            organizationId,
            veteranUserIds.Count);

        return veteranUserIds;
    }
}
