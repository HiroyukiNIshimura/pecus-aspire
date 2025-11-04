using Hangfire;
using Microsoft.Extensions.Configuration;

namespace Pecus.BackFire.Services;

/// <summary>
/// クリーンアップジョブのスケジューリングを管理するクラス
/// </summary>
public static class CleanupJobScheduler
{
    /// <summary>
    /// クリーンアップ関連の定期ジョブを設定します
    /// </summary>
    /// <param name="configuration">設定</param>
    public static void ConfigureCleanupJobs(IConfiguration configuration)
    {
        ConfigureRefreshTokenCleanupJob(configuration);
        ConfigureDeviceCleanupJob(configuration);
    }

    /// <summary>
    /// リフレッシュトークンクリーンアップジョブを設定します
    /// </summary>
    /// <param name="configuration">設定</param>
    private static void ConfigureRefreshTokenCleanupJob(IConfiguration configuration)
    {
        // 設定をクラスバインド
        var settings = configuration.GetSection("RefreshTokenCleanup").Get<RefreshTokenCleanupSettings>() ?? new RefreshTokenCleanupSettings();

        // 値の範囲を安全にクリップ
        settings.Hour = Math.Clamp(settings.Hour, 0, 23);
        settings.Minute = Math.Clamp(settings.Minute, 0, 59);

        RecurringJob.AddOrUpdate<Pecus.Libs.Hangfire.Tasks.CleanupTasks>(
            "RefreshTokenCleanup",
            task => task.CleanupExpiredTokensAsync(settings.BatchSize, settings.OlderThanDays),
            Cron.Daily(settings.Hour, settings.Minute) // 設定で指定した時刻に実行
        );
    }

    /// <summary>
    /// デバイスクリーンアップジョブを設定します
    /// </summary>
    /// <param name="configuration">設定</param>
    private static void ConfigureDeviceCleanupJob(IConfiguration configuration)
    {
        // 設定をクラスバインド
        var settings = configuration.GetSection("DeviceCleanup").Get<DeviceCleanupSettings>() ?? new DeviceCleanupSettings();

        // 値の範囲を安全にクリップ
        settings.Hour = Math.Clamp(settings.Hour, 0, 23);
        settings.Minute = Math.Clamp(settings.Minute, 0, 59);

        RecurringJob.AddOrUpdate<Pecus.Libs.Hangfire.Tasks.CleanupTasks>(
            "DeviceCleanup",
            task => task.CleanupOldDevicesAsync(settings.BatchSize, settings.OlderThanDays, settings.VeryOldDays),
            Cron.Daily(settings.Hour, settings.Minute) // 設定で指定した時刻に実行
        );
    }
}