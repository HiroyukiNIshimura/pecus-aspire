using Hangfire;

namespace Pecus.BackFire.Services;

/// <summary>
/// システム通知（DB管理）の配信ジョブをスケジューリングするクラス
/// BackOfficeで登録されたSystemNotificationを定期的に配信する
/// </summary>
public static class SystemNotificationJobScheduler
{
    /// <summary>
    /// システム通知配信ジョブを設定します
    /// </summary>
    /// <param name="configuration">設定</param>
    public static void ConfigureSystemNotificationJob(IConfiguration configuration)
    {
        var settings = configuration.GetSection("SystemNotification")
            .Get<SystemNotificationSettings>() ?? new SystemNotificationSettings();

        if (!settings.Enabled)
        {
            RecurringJob.RemoveIfExists("SystemNotificationDelivery");
            return;
        }

        RecurringJob.AddOrUpdate<Pecus.Libs.Hangfire.Tasks.SystemNotificationDeliveryTask>(
            "SystemNotificationDelivery",
            task => task.ProcessPendingNotificationsAsync(),
            settings.CronExpression
        );
    }
}

/// <summary>
/// システム通知配信ジョブの設定
/// </summary>
public class SystemNotificationSettings
{
    /// <summary>
    /// ジョブを有効にするかどうか
    /// </summary>
    public bool Enabled { get; set; } = true;

    /// <summary>
    /// Cron式（デフォルト: 毎分実行）
    /// </summary>
    public string CronExpression { get; set; } = "* * * * *";
}