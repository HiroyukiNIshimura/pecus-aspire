using Hangfire;

namespace Pecus.BackFire.Services;

/// <summary>
/// アジェンダリマインダージョブをスケジューリングするクラス
/// 5分ごとにリマインダー処理を実行する
/// </summary>
public static class AgendaReminderJobScheduler
{
    /// <summary>
    /// アジェンダリマインダージョブを設定します
    /// </summary>
    /// <param name="recurringJobManager">Hangfire定期ジョブマネージャー</param>
    /// <param name="configuration">設定</param>
    public static void ConfigureAgendaReminderJob(IRecurringJobManager recurringJobManager, IConfiguration configuration)
    {
        var settings = configuration.GetSection("AgendaReminder")
            .Get<AgendaReminderSettings>() ?? new AgendaReminderSettings();

        if (!settings.Enabled)
        {
            recurringJobManager.RemoveIfExists("AgendaReminder");
            return;
        }

        recurringJobManager.AddOrUpdate<Pecus.Libs.Hangfire.Tasks.AgendaReminderTask>(
            "AgendaReminder",
            task => task.ProcessRemindersAsync(),
            settings.CronExpression
        );
    }
}

/// <summary>
/// アジェンダリマインダージョブの設定
/// </summary>
public class AgendaReminderSettings
{
    /// <summary>
    /// ジョブを有効にするかどうか
    /// </summary>
    public bool Enabled { get; set; } = true;

    /// <summary>
    /// Cron式（デフォルト: 5分ごと）
    /// </summary>
    public string CronExpression { get; set; } = "*/5 * * * *";
}
