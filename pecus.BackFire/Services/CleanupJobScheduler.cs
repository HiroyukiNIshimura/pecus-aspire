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
        // 設定からバッチサイズと古いトークンの保持期間を取得
        var cleanupSection = configuration.GetSection("RefreshTokenCleanup");
        var cleanupBatchSize = cleanupSection.GetValue<int?>("BatchSize") ?? 1000;
        var cleanupOlderThanDays = cleanupSection.GetValue<int?>("OlderThanDays") ?? 30;

        // Cron の時刻を設定から取得（デフォルト: 毎日 02:00）
        var cleanupHour = cleanupSection.GetValue<int?>("Hour") ?? 2;
        var cleanupMinute = cleanupSection.GetValue<int?>("Minute") ?? 0;

        // 値の範囲を安全にクリップ
        cleanupHour = Math.Clamp(cleanupHour, 0, 23);
        cleanupMinute = Math.Clamp(cleanupMinute, 0, 59);

        RecurringJob.AddOrUpdate<Pecus.Libs.Hangfire.Tasks.CleanupTasks>(
            "RefreshTokenCleanup",
            task => task.CleanupExpiredTokensAsync(cleanupBatchSize, cleanupOlderThanDays),
            Cron.Daily(cleanupHour, cleanupMinute) // 設定で指定した時刻に実行
        );
    }

    /// <summary>
    /// デバイスクリーンアップジョブを設定します
    /// </summary>
    /// <param name="configuration">設定</param>
    private static void ConfigureDeviceCleanupJob(IConfiguration configuration)
    {
        // 設定からバッチサイズと古いデバイスの保持期間を取得
        var deviceCleanupSection = configuration.GetSection("DeviceCleanup");
        var deviceCleanupBatchSize = deviceCleanupSection.GetValue<int?>("BatchSize") ?? 1000;
        var deviceCleanupOlderThanDays = deviceCleanupSection.GetValue<int?>("OlderThanDays") ?? 30;
        var deviceCleanupVeryOldDays = deviceCleanupSection.GetValue<int?>("VeryOldDays") ?? 365;

        // Cron の時刻を設定から取得（デフォルト: 毎日 02:30）
        var deviceCleanupHour = deviceCleanupSection.GetValue<int?>("Hour") ?? 2;
        var deviceCleanupMinute = deviceCleanupSection.GetValue<int?>("Minute") ?? 30;

        // 値の範囲を安全にクリップ
        deviceCleanupHour = Math.Clamp(deviceCleanupHour, 0, 23);
        deviceCleanupMinute = Math.Clamp(deviceCleanupMinute, 0, 59);

        RecurringJob.AddOrUpdate<Pecus.Libs.Hangfire.Tasks.CleanupTasks>(
            "DeviceCleanup",
            task => task.CleanupOldDevicesAsync(deviceCleanupBatchSize, deviceCleanupOlderThanDays, deviceCleanupVeryOldDays),
            Cron.Daily(deviceCleanupHour, deviceCleanupMinute) // 設定で指定した時刻に実行
        );
    }
}