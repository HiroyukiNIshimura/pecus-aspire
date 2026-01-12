using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.DB;

namespace Pecus.Libs.Achievements.Strategies;

/// <summary>
/// 見積もりの魔術師 - 見積時間と実績時間の誤差が10%以内のタスクを10件完了した
/// </summary>
public class EstimationWizardStrategy : AchievementStrategyBase
{
    private const int RequiredCount = 10;
    private const double AllowedErrorPercentage = 0.1;

    /// <summary>
    /// <see cref="EstimationWizardStrategy"/> クラスの新しいインスタンスを初期化します。
    /// </summary>
    /// <param name="context">データベースコンテキスト。</param>
    /// <param name="logger">ロガー。</param>
    public EstimationWizardStrategy(ApplicationDbContext context, ILogger<EstimationWizardStrategy> logger)
        : base(context, logger)
    {
    }

    /// <inheritdoc/>
    public override string AchievementCode => "ESTIMATION_WIZARD";

    /// <inheritdoc/>
    public override async Task<IEnumerable<int>> EvaluateAsync(
        int organizationId,
        DateTimeOffset evaluationDate,
        CancellationToken cancellationToken = default)
    {
        var completedTasks = await Context.WorkspaceTasks
            .AsNoTracking()
            .Where(t => t.OrganizationId == organizationId)
            .Where(t => t.IsCompleted)
            .Where(t => t.EstimatedHours != null && t.EstimatedHours > 0)
            .Where(t => t.ActualHours != null && t.ActualHours > 0)
            .Select(t => new
            {
                t.AssignedUserId,
                EstimatedHours = t.EstimatedHours!.Value,
                ActualHours = t.ActualHours!.Value
            })
            .ToListAsync(cancellationToken);

        var accurateEstimators = completedTasks
            .Where(t =>
            {
                var difference = Math.Abs(t.EstimatedHours - t.ActualHours);
                var errorRate = (double)difference / (double)t.EstimatedHours;
                return errorRate <= AllowedErrorPercentage;
            })
            .GroupBy(t => t.AssignedUserId)
            .Where(g => g.Count() >= RequiredCount)
            .OrderBy(g => g.Key)
            .Select(g => g.Key)
            .Take(MaxResultsPerEvaluation)
            .ToList();

        Logger.LogDebug(
            "EstimationWizard evaluation for org {OrganizationId}: {Count} users qualified",
            organizationId,
            accurateEstimators.Count);

        return accurateEstimators;
    }
}
