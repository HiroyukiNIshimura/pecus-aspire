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

        // 値の範囲を安全にクリップ
        settings.Hour = Math.Clamp(settings.Hour, 0, 23);
        settings.Minute = Math.Clamp(settings.Minute, 0, 59);
        settings.DayOfWeek = Math.Clamp(settings.DayOfWeek, 0, 6);

        // 週次実行（デフォルト: 月曜 AM4:00 UTC）
        recurringJobManager.AddOrUpdate<LandingPageRecommendationTasks>(
            "LandingPageRecommendation",
            task => task.DispatchLandingPageAnalysisAsync(),
            Cron.Weekly((DayOfWeek)settings.DayOfWeek, settings.Hour, settings.Minute),
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
    /// 実行曜日（0=日曜, 1=月曜, ..., 6=土曜）デフォルト: 1（月曜）
    /// </summary>
    public int DayOfWeek { get; set; } = 1;

    /// <summary>
    /// 実行時刻（時）デフォルト: 4時（UTC）
    /// </summary>
    public int Hour { get; set; } = 4;

    /// <summary>
    /// 実行時刻（分）デフォルト: 0分
    /// </summary>
    public int Minute { get; set; } = 0;
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
