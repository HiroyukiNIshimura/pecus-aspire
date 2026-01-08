using Hangfire;
using Pecus.Libs.Hangfire.Tasks;
using Pecus.Libs.WeeklyReport;

namespace Pecus.BackFire.Services;

/// <summary>
/// 週間レポートジョブのスケジューリングを管理するクラス
/// </summary>
public static class WeeklyReportJobScheduler
{
    /// <summary>
    /// 週間レポートの定期ジョブを設定します
    /// </summary>
    /// <param name="recurringJobManager">Hangfire定期ジョブマネージャー</param>
    /// <param name="configuration">設定</param>
    public static void ConfigureWeeklyReportJob(IRecurringJobManager recurringJobManager, IConfiguration configuration)
    {
        var settings = configuration.GetSection(WeeklyReportSettings.SectionName).Get<WeeklyReportSettings>()
            ?? new WeeklyReportSettings();

        // 値の範囲を安全にクリップ
        settings.DeliveryHour = Math.Clamp(settings.DeliveryHour, 0, 23);
        settings.DeliveryMinute = Math.Clamp(settings.DeliveryMinute, 0, 59);

        // 毎日指定時刻に実行（各組織の配信曜日を確認してキュー）
        recurringJobManager.AddOrUpdate<WeeklyReportTasks>(
            "WeeklyReportScheduler",
            task => task.CheckAndDispatchWeeklyReportsAsync(),
            Cron.Daily(settings.DeliveryHour, settings.DeliveryMinute)
        );
    }
}

/// <summary>
/// WeeklyReportDataCollector の DI 拡張メソッド
/// </summary>
public static class WeeklyReportServiceExtensions
{
    /// <summary>
    /// WeeklyReport 関連サービスを登録します
    /// </summary>
    public static IServiceCollection AddWeeklyReportServices(this IServiceCollection services)
    {
        services.AddScoped<WeeklyReportDataCollector>();
        services.AddScoped<WeeklyReportTasks>();
        return services;
    }
}