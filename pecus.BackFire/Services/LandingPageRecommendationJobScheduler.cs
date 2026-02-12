using Hangfire;
using Pecus.Libs.Hangfire.Tasks;

namespace Pecus.BackFire.Services;

/// <summary>
/// ランディングページ推奨ジョブのスケジューリングを管理するクラス
/// </summary>
public static class LandingPageRecommendationJobScheduler
{
    /// <summary>
    /// ランディングページ推奨の定期ジョブを設定します
    /// </summary>
    /// <param name="recurringJobManager">Hangfire定期ジョブマネージャー</param>
    /// <param name="configuration">設定</param>
    public static void ConfigureLandingPageRecommendationJob(
        IRecurringJobManager recurringJobManager,
        IConfiguration configuration)
    {
        // 設定をクラスバインド
        var settings = configuration
            .GetSection("LandingPageRecommendation")
            .Get<LandingPageRecommendationSettings>()
            ?? new LandingPageRecommendationSettings();

        if (!settings.Enabled)
        {
            recurringJobManager.RemoveIfExists("LandingPageRecommendation");
            return;
        }

        recurringJobManager.AddOrUpdate<LandingPageRecommendationTasks>(
            "LandingPageRecommendation",
            task => task.DispatchLandingPageAnalysisAsync(),
            settings.CronExpression,
            new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc }
        );
    }
}

/// <summary>
/// ランディングページ推奨ジョブの設定
/// </summary>
public class LandingPageRecommendationSettings
{
    /// <summary>
    /// ジョブを有効にするかどうか
    /// </summary>
    public bool Enabled { get; set; } = true;

    /// <summary>
    /// Cron式（デフォルト: 毎週月曜日 AM4:00 UTC）
    /// </summary>
    public string CronExpression { get; set; } = "0 4 * * 1";
}

/// <summary>
/// ランディングページ推奨サービスの DI 拡張メソッド
/// </summary>
public static class LandingPageRecommendationServiceExtensions
{
    /// <summary>
    /// ランディングページ推奨関連サービスを登録します
    /// </summary>
    public static IServiceCollection AddLandingPageRecommendationServices(this IServiceCollection services)
    {
        services.AddScoped<Pecus.Libs.Landing.LandingPageRecommendationService>();
        services.AddScoped<LandingPageRecommendationTasks>();
        return services;
    }
}