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

        // 値の範囲を安全にクリップ
        settings.Hour = Math.Clamp(settings.Hour, 0, 23);
        settings.Minute = Math.Clamp(settings.Minute, 0, 59);

        recurringJobManager.AddOrUpdate<Pecus.Libs.Hangfire.Tasks.AchievementEvaluationTask>(
            "AchievementEvaluation",
            task => task.EvaluateAllOrganizationsAsync(),
            Cron.Daily(settings.Hour, settings.Minute),
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
    /// 実行時刻（時）デフォルト: 3時（UTC）
    /// </summary>
    public int Hour { get; set; } = 3;

    /// <summary>
    /// 実行時刻（分）デフォルト: 0分
    /// </summary>
    public int Minute { get; set; } = 0;
}
