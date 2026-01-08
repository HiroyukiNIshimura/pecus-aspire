using Hangfire;

namespace Pecus.BackFire.Services;

/// <summary>
/// クリーンアップジョブのスケジューリングを管理するクラス
/// </summary>
public static class CleanupJobScheduler
{
    /// <summary>
    /// クリーンアップ関連の定期ジョブを設定します
    /// </summary>
    /// <param name="recurringJobManager">Hangfire定期ジョブマネージャー</param>
    /// <param name="configuration">設定</param>
    public static void ConfigureCleanupJobs(IRecurringJobManager recurringJobManager, IConfiguration configuration)
    {
        ConfigureRefreshTokenCleanupJob(recurringJobManager, configuration);
        ConfigureDeviceCleanupJob(recurringJobManager, configuration);
        ConfigureEmailChangeTokenCleanupJob(recurringJobManager, configuration);
        ConfigureChatCleanupJob(recurringJobManager, configuration);
        ConfigureUploadsCleanupJob(recurringJobManager, configuration);
    }

    /// <summary>
    /// リフレッシュトークンクリーンアップジョブを設定します
    /// </summary>
    /// <param name="recurringJobManager">Hangfire定期ジョブマネージャー</param>
    /// <param name="configuration">設定</param>
    private static void ConfigureRefreshTokenCleanupJob(IRecurringJobManager recurringJobManager, IConfiguration configuration)
    {
        // 設定をクラスバインド
        var settings = configuration.GetSection("RefreshTokenCleanup").Get<RefreshTokenCleanupSettings>() ?? new RefreshTokenCleanupSettings();

        // 値の範囲を安全にクリップ
        settings.Hour = Math.Clamp(settings.Hour, 0, 23);
        settings.Minute = Math.Clamp(settings.Minute, 0, 59);

        recurringJobManager.AddOrUpdate<Pecus.Libs.Hangfire.Tasks.CleanupTasks>(
            "RefreshTokenCleanup",
            task => task.CleanupExpiredTokensAsync(settings.BatchSize, settings.OlderThanDays),
            Cron.Daily(settings.Hour, settings.Minute) // 設定で指定した時刻に実行
        );
    }

    /// <summary>
    /// デバイスクリーンアップジョブを設定します
    /// </summary>
    /// <param name="recurringJobManager">Hangfire定期ジョブマネージャー</param>
    /// <param name="configuration">設定</param>
    private static void ConfigureDeviceCleanupJob(IRecurringJobManager recurringJobManager, IConfiguration configuration)
    {
        // 設定をクラスバインド
        var settings = configuration.GetSection("DeviceCleanup").Get<DeviceCleanupSettings>() ?? new DeviceCleanupSettings();

        // 値の範囲を安全にクリップ
        settings.Hour = Math.Clamp(settings.Hour, 0, 23);
        settings.Minute = Math.Clamp(settings.Minute, 0, 59);

        recurringJobManager.AddOrUpdate<Pecus.Libs.Hangfire.Tasks.CleanupTasks>(
            "DeviceCleanup",
            task => task.CleanupOldDevicesAsync(settings.BatchSize, settings.OlderThanDays, settings.VeryOldDays),
            Cron.Daily(settings.Hour, settings.Minute) // 設定で指定した時刻に実行
        );
    }

    /// <summary>
    /// メールアドレス変更トークンクリーンアップジョブを設定します
    /// </summary>
    /// <param name="recurringJobManager">Hangfire定期ジョブマネージャー</param>
    /// <param name="configuration">設定</param>
    private static void ConfigureEmailChangeTokenCleanupJob(IRecurringJobManager recurringJobManager, IConfiguration configuration)
    {
        // 設定をクラスバインド
        var settings = configuration.GetSection("EmailChangeTokenCleanup").Get<EmailChangeTokenCleanupSettings>() ?? new EmailChangeTokenCleanupSettings();

        // 値の範囲を安全にクリップ
        settings.Hour = Math.Clamp(settings.Hour, 0, 23);
        settings.Minute = Math.Clamp(settings.Minute, 0, 59);

        recurringJobManager.AddOrUpdate<Pecus.Libs.Hangfire.Tasks.CleanupTasks>(
            "EmailChangeTokenCleanup",
            task => task.CleanupExpiredEmailChangeTokensAsync(settings.BatchSize, settings.OlderThanDays),
            Cron.Daily(settings.Hour, settings.Minute) // 設定で指定した時刻に実行
        );
    }

    /// <summary>
    /// チャットメッセージのクリーンアップジョブを設定します
    /// </summary>
    /// <param name="recurringJobManager">Hangfire定期ジョブマネージャー</param>
    /// <param name="configuration">設定</param>
    private static void ConfigureChatCleanupJob(IRecurringJobManager recurringJobManager, IConfiguration configuration)
    {
        var settings = configuration.GetSection("ChatCleanup").Get<ChatCleanupSettings>() ?? new ChatCleanupSettings();

        // 値の範囲を安全にクリップ（時刻）
        settings.Hour = Math.Clamp(settings.Hour, 0, 23);
        settings.Minute = Math.Clamp(settings.Minute, 0, 59);

        // すべてのタイプが無効（<=0）なら登録しない
        var allDisabled =
            (settings.System?.OlderThanDays ?? 0) <= 0 &&
            (settings.Group?.OlderThanDays ?? 0) <= 0 &&
            (settings.Dm?.OlderThanDays ?? 0) <= 0 &&
            (settings.Ai?.OlderThanDays ?? 0) <= 0;

        if (allDisabled)
        {
            return;
        }

        // null 条件や式ツリーに含めないようにローカル変数へ展開してから渡す
        var batchSize = settings.BatchSize;
        var systemDays = settings.System?.OlderThanDays ?? 0;
        var groupDays = settings.Group?.OlderThanDays ?? 0;
        var dmDays = settings.Dm?.OlderThanDays ?? 0;
        var aiDays = settings.Ai?.OlderThanDays ?? 0;

        recurringJobManager.AddOrUpdate<Pecus.Libs.Hangfire.Tasks.CleanupTasks>(
            "ChatCleanup",
            task => task.CleanupOldChatMessagesAsync(batchSize, systemDays, groupDays, dmDays, aiDays),
            Cron.Daily(settings.Hour, settings.Minute)
        );
    }

    /// <summary>
    /// アップロードフォルダクリーンアップジョブを設定します
    /// </summary>
    /// <param name="recurringJobManager">Hangfire定期ジョブマネージャー</param>
    /// <param name="configuration">設定</param>
    private static void ConfigureUploadsCleanupJob(IRecurringJobManager recurringJobManager, IConfiguration configuration)
    {
        // 設定をクラスバインド
        var settings = configuration.GetSection("UploadsCleanup").Get<UploadsCleanupSettings>() ?? new UploadsCleanupSettings();

        // UploadsBasePath が設定されていない場合はジョブを登録しない
        if (string.IsNullOrWhiteSpace(settings.UploadsBasePath))
        {
            return;
        }

        // パスが存在しない場合も警告のみでスキップ
        if (!Directory.Exists(settings.UploadsBasePath))
        {
            return;
        }

        // 値の範囲を安全にクリップ
        settings.Hour = Math.Clamp(settings.Hour, 0, 23);
        settings.Minute = Math.Clamp(settings.Minute, 0, 59);

        recurringJobManager.AddOrUpdate<Pecus.Libs.Hangfire.Tasks.UploadsCleanupTasks>(
            "UploadsCleanup",
            task => task.CleanupUploadsAsync(settings.UploadsBasePath, settings.TempRetentionHours),
            Cron.Daily(settings.Hour, settings.Minute) // 設定で指定した時刻に実行
        );
    }
}