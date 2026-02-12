using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Libs.Landing;

namespace Pecus.Libs.Hangfire.Tasks;

/// <summary>
/// ランディングページ推奨分析の Hangfire タスク
/// </summary>
/// <remarks>
/// 週次実行で、ユーザーのアクティビティパターンを分析し、
/// 最適なランディングページを推奨します。
/// 組織単位でファンアウトし、ユーザーごとにストリーミング処理することで
/// メモリ効率を最適化しています。
/// </remarks>
public class LandingPageRecommendationTasks
{
    private readonly ILogger<LandingPageRecommendationTasks> _logger;
    private readonly ApplicationDbContext _context;
    private readonly LandingPageRecommendationService _recommendationService;
    private readonly IBackgroundJobClient _backgroundJobClient;

    /// <summary>
    /// アクティビティ分析の対象期間（日数）
    /// </summary>
    private const int AnalysisPeriodDays = 30;

    /// <summary>
    /// コンストラクタ
    /// </summary>
    public LandingPageRecommendationTasks(
        ILogger<LandingPageRecommendationTasks> logger,
        ApplicationDbContext context,
        LandingPageRecommendationService recommendationService,
        IBackgroundJobClient backgroundJobClient)
    {
        _logger = logger;
        _context = context;
        _recommendationService = recommendationService;
        _backgroundJobClient = backgroundJobClient;
    }

    /// <summary>
    /// 週次実行: 全組織の推奨分析をディスパッチ
    /// </summary>
    public async Task DispatchLandingPageAnalysisAsync()
    {
        _logger.LogInformation("LandingPageRecommendation: Starting weekly dispatch...");

        // アクティブな非デモ組織を取得（組織数は限定的なので一括取得OK）
        var organizationIds = await _context.Organizations
            .Where(o => !o.IsDemo && o.IsActive)
            .Select(o => o.Id)
            .ToListAsync();

        foreach (var orgId in organizationIds)
        {
            // 組織ごとにジョブをキュー（ファンアウト）
            _backgroundJobClient.Enqueue<LandingPageRecommendationTasks>(
                task => task.AnalyzeOrganizationUsersAsync(orgId));
        }

        _logger.LogInformation(
            "LandingPageRecommendation: Dispatched {Count} organization jobs",
            organizationIds.Count);
    }

    /// <summary>
    /// 組織単位: ユーザーの推奨分析を実行
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    public async Task AnalyzeOrganizationUsersAsync(int organizationId)
    {
        _logger.LogInformation(
            "LandingPageRecommendation: Starting analysis for organization {OrgId}",
            organizationId);

        var cutoffDate = DateTimeOffset.UtcNow.AddDays(-AnalysisPeriodDays);
        var processedCount = 0;
        var updatedCount = 0;

        // 組織内のアクティブユーザーIDを取得（intの配列なのでメモリ負荷は軽微）
        var userIds = await _context.Users
            .Where(u => u.OrganizationId == organizationId && u.IsActive)
            .Select(u => u.Id)
            .ToListAsync();

        foreach (var userId in userIds)
        {
            try
            {
                var updated = await AnalyzeAndUpdateUserAsync(userId, cutoffDate);
                if (updated)
                {
                    updatedCount++;
                }
                processedCount++;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "LandingPageRecommendation: Failed to analyze user {UserId}",
                    userId);
                // 1ユーザーの失敗で全体を止めない
            }
        }

        _logger.LogInformation(
            "LandingPageRecommendation: Organization {OrgId} completed. Processed={Processed}, Updated={Updated}",
            organizationId, processedCount, updatedCount);
    }

    /// <summary>
    /// ユーザー単位の分析と更新
    /// </summary>
    /// <param name="userId">ユーザーID</param>
    /// <param name="cutoffDate">分析対象の開始日時</param>
    /// <returns>推奨値を更新した場合は true</returns>
    private async Task<bool> AnalyzeAndUpdateUserAsync(int userId, DateTimeOffset cutoffDate)
    {
        // アクティビティをDB側で集計（メモリに全件ロードしない）
        var actionCounts = await _context.Activities
            .Where(a => a.UserId == userId && a.CreatedAt >= cutoffDate)
            .GroupBy(a => a.ActionType)
            .Select(g => new { ActionType = g.Key, Count = g.Count() })
            .ToListAsync();

        // スコアリング
        var result = _recommendationService.CalculateRecommendation(
            actionCounts.Select(ac => (ac.ActionType, ac.Count)));

        // 推奨値がない場合は更新不要
        if (result.Recommendation == null)
        {
            return false;
        }

        // ユーザー設定を取得
        var userSetting = await _context.UserSettings
            .FirstOrDefaultAsync(us => us.UserId == userId);

        if (userSetting == null)
        {
            // 設定がない場合は作成しない（ユーザーが初めてログインしたときに作成される）
            return false;
        }

        // 現在の設定と同じ場合は更新不要
        var effectiveCurrent = userSetting.LandingPage ?? LandingPage.Dashboard;
        if (effectiveCurrent == result.Recommendation)
        {
            // 同じ推奨なら pending をクリア
            if (userSetting.PendingLandingPageRecommendation != null)
            {
                userSetting.PendingLandingPageRecommendation = null;
                await _context.SaveChangesAsync();
            }
            return false;
        }

        // 提示条件を満たすか確認
        var shouldPresent = _recommendationService.ShouldPresentRecommendation(
            userSetting.LandingPage,
            result.Recommendation,
            userSetting.LandingPageUpdatedAt,
            userSetting.LandingPageRecommendationRefusedAt);

        if (!shouldPresent)
        {
            return false;
        }

        // 推奨値を設定
        userSetting.PendingLandingPageRecommendation = result.Recommendation;
        await _context.SaveChangesAsync();

        _logger.LogDebug(
            "LandingPageRecommendation: User {UserId} recommendation set to {Recommendation} (Scores: Tasks={Tasks}, Workspace={Workspace}, Committer={Committer})",
            userId,
            result.Recommendation,
            result.MyTasksScore,
            result.WorkspaceScore,
            result.CommitterScore);

        return true;
    }
}