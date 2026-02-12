using Hangfire;

namespace Pecus.BackFire.Services;

/// <summary>
/// アジェンダメール送信ジョブをスケジューリングするクラス
/// 未送信のAgendaNotificationに対してメールを送信する
/// </summary>
public static class AgendaEmailJobScheduler
{
    /// <summary>
    /// アジェンダメール送信ジョブを設定します
    /// </summary>
    /// <param name="recurringJobManager">Hangfire定期ジョブマネージャー</param>
    /// <param name="configuration">設定</param>
    public static void ConfigureAgendaEmailJob(IRecurringJobManager recurringJobManager, IConfiguration configuration)
    {
        var settings = configuration.GetSection("AgendaEmail")
            .Get<AgendaEmailSettings>() ?? new AgendaEmailSettings();

        if (!settings.Enabled)
        {
            recurringJobManager.RemoveIfExists("AgendaEmail");
            return;
        }

        recurringJobManager.AddOrUpdate<Pecus.Libs.Hangfire.Tasks.AgendaEmailTask>(
            "AgendaEmail",
            task => task.ProcessPendingEmailsAsync(),
            settings.CronExpression
        );
    }
}

/// <summary>
/// アジェンダメール送信ジョブの設定
/// </summary>
public class AgendaEmailSettings
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