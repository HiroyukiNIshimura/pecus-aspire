using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.Achievements;
using Pecus.Libs.DB;

namespace Pecus.Libs.Hangfire.Tasks;

/// <summary>
/// 夜間バッチで全組織・全ユーザーの実績判定を行う Hangfire タスク
/// </summary>
public class AchievementEvaluationTask
{
    private readonly ILogger<AchievementEvaluationTask> _logger;
    private readonly ApplicationDbContext _context;
    private readonly AchievementEvaluator _evaluator;

    /// <summary>
    /// <see cref="AchievementEvaluationTask"/> クラスの新しいインスタンスを初期化します。
    /// </summary>
    /// <param name="logger">ロガー。</param>
    /// <param name="context">データベースコンテキスト。</param>
    /// <param name="evaluator">実績評価サービス。</param>
    public AchievementEvaluationTask(
        ILogger<AchievementEvaluationTask> logger,
        ApplicationDbContext context,
        AchievementEvaluator evaluator)
    {
        _logger = logger;
        _context = context;
        _evaluator = evaluator;
    }

    /// <summary>
    /// 全アクティブ組織の実績判定を実行します。
    /// </summary>
    /// <returns>非同期タスク。</returns>
    public async Task EvaluateAllOrganizationsAsync()
    {
        _logger.LogInformation("Achievement evaluation batch started");
        var startTime = DateTimeOffset.UtcNow;

        try
        {
            // Gamification機能が有効な組織のみ取得
            var activeOrganizationIds = await _context.OrganizationSettings
                .AsNoTracking()
                .Where(os => os.GamificationEnabled)
                .Select(os => os.OrganizationId)
                .ToListAsync();

            _logger.LogInformation(
                "Found {Count} organizations with gamification enabled",
                activeOrganizationIds.Count);

            var totalNewAchievements = 0;

            foreach (var organizationId in activeOrganizationIds)
            {
                try
                {
                    var newCount = await _evaluator.EvaluateOrganizationAsync(organizationId);
                    totalNewAchievements += newCount;

                    _logger.LogInformation(
                        "Organization {OrganizationId}: {NewCount} new achievements awarded",
                        organizationId,
                        newCount);
                }
                catch (Exception ex)
                {
                    _logger.LogError(
                        ex,
                        "Failed to evaluate achievements for organization {OrganizationId}",
                        organizationId);
                }
            }

            var elapsed = DateTimeOffset.UtcNow - startTime;
            _logger.LogInformation(
                "Achievement evaluation batch completed. Total new achievements: {Total}, Elapsed: {Elapsed}",
                totalNewAchievements,
                elapsed);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Achievement evaluation batch failed");
            throw;
        }
    }

    /// <summary>
    /// 指定組織の実績判定を実行します（テスト・手動実行用）。
    /// </summary>
    /// <param name="organizationId">組織ID。</param>
    /// <returns>新規獲得した実績の件数。</returns>
    public async Task<int> EvaluateOrganizationAsync(int organizationId)
    {
        _logger.LogInformation(
            "Manual achievement evaluation started for organization {OrganizationId}",
            organizationId);

        // Gamification有効チェック
        var setting = await _context.OrganizationSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(os => os.OrganizationId == organizationId);

        if (setting == null || !setting.GamificationEnabled)
        {
            _logger.LogWarning(
                "Gamification is disabled for organization {OrganizationId}",
                organizationId);
            return 0;
        }

        var newCount = await _evaluator.EvaluateOrganizationAsync(organizationId);

        _logger.LogInformation(
            "Manual achievement evaluation completed for organization {OrganizationId}: {NewCount} new achievements",
            organizationId,
            newCount);

        return newCount;
    }
}
