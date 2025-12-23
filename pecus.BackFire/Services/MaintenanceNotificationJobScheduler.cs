using Hangfire;

namespace Pecus.BackFire.Services;

/// <summary>
/// 運営通知ジョブのスケジューリングを管理するクラス
/// </summary>
public static class MaintenanceNotificationJobScheduler
{
    /// <summary>
    /// 運営通知ジョブを設定します
    /// </summary>
    /// <param name="configuration">設定</param>
    public static void ConfigureMaintenanceNotificationJob(IConfiguration configuration)
    {
        var settings = configuration.GetSection("MaintenanceNotification")
            .Get<MaintenanceNotificationSettings>() ?? new MaintenanceNotificationSettings();

        if (!settings.Enabled)
        {
            RecurringJob.RemoveIfExists("MaintenanceNotification");
            return;
        }

        if (string.IsNullOrEmpty(settings.NotificationsPath))
        {
            throw new InvalidOperationException(
                "MaintenanceNotification:NotificationsPath is required when Enabled=true");
        }

        RecurringJob.AddOrUpdate<Pecus.Libs.Hangfire.Tasks.MaintenanceNotificationTask>(
            "MaintenanceNotification",
            task => task.ProcessPendingNotificationsAsync(settings.NotificationsPath),
            "*/30 * * * *"
        );
    }
}

/// <summary>
/// 運営通知ジョブの設定
/// </summary>
public class MaintenanceNotificationSettings
{
    /// <summary>
    /// ジョブを有効にするかどうか
    /// </summary>
    public bool Enabled { get; set; } = true;

    /// <summary>
    /// 通知ファイルを配置する外部ディレクトリのパス
    /// </summary>
    public string? NotificationsPath { get; set; }
}
