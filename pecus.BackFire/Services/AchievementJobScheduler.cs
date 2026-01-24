using Hangfire;

namespace Pecus.BackFire.Services;

/// <summary>
/// 実績判定ジョブのスケジューリングを管理するクラス
/// </summary>
public static class AchievementJobScheduler
{
    /// <summary>
    /// 実績判定の定期ジョブを設定します
    /// </summary>
    /// <param name="recurringJobManager">Hangfire定期ジョブマネージャー</param>
    /// <param name="configuration">設定</param>
    public static void ConfigureAchievementJob(IRecurringJobManager recurringJobManager, IConfiguration configuration)
    {
        // 設定をクラスバインド
        var settings = configuration.GetSection("AchievementEvaluation").Get<AchievementEvaluationSettings>()
            ?? new AchievementEvaluationSettings();

        if (!settings.Enabled)
        {
            recurringJobManager.RemoveIfExists("AchievementEvaluation");
            return;
        }

        recurringJobManager.AddOrUpdate<Pecus.Libs.Hangfire.Tasks.AchievementEvaluationTask>(
            "AchievementEvaluation",
            task => task.EvaluateAllOrganizationsAsync(),
            settings.CronExpression,
            new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc }
        );
    }
}

/// <summary>
/// 実績判定ジョブの設定
/// </summary>
public class AchievementEvaluationSettings
{
    /// <summary>
    /// ジョブを有効にするかどうか
    /// </summary>
    public bool Enabled { get; set; } = true;

    /// <summary>
    /// Cron式（デフォルト: 毎日3:00 UTC）
    /// </summary>
    public string CronExpression { get; set; } = "0 3 * * *";
}
