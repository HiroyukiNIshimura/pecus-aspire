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
    /// <param name="notificationsDirectory">Notifications フォルダの絶対パス</param>
    public static void ConfigureMaintenanceNotificationJob(
        IConfiguration configuration,
        string notificationsDirectory)
    {
        var settings = configuration.GetSection("MaintenanceNotification")
            .Get<MaintenanceNotificationSettings>() ?? new MaintenanceNotificationSettings();

        if (!settings.Enabled)
        {
            RecurringJob.RemoveIfExists("MaintenanceNotification");
            return;
        }

        RecurringJob.AddOrUpdate<Pecus.Libs.Hangfire.Tasks.MaintenanceNotificationTask>(
            "MaintenanceNotification",
            task => task.ProcessPendingNotificationsAsync(notificationsDirectory),
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
}
