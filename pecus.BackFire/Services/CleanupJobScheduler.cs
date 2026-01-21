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
        ConfigureAgendaCleanupJob(recurringJobManager, configuration);
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

        // DataPaths:Uploads から絶対パスを取得（環境変数 DataPaths__Uploads 経由）
        var uploadsPath = configuration["DataPaths:Uploads"];
        if (string.IsNullOrWhiteSpace(uploadsPath))
        {
            Serilog.Log.Warning("UploadsCleanup: DataPaths:Uploads is not configured. Skipping job registration.");
            return;
        }

        // パスが存在しない場合は作成を試みる
        if (!Directory.Exists(uploadsPath))
        {
            try
            {
                Directory.CreateDirectory(uploadsPath);
                Serilog.Log.Information("UploadsCleanup: Created directory {UploadsPath}", uploadsPath);
            }
            catch (Exception ex)
            {
                Serilog.Log.Warning(ex, "UploadsCleanup: Failed to create directory {UploadsPath}. Skipping job registration.", uploadsPath);
                return;
            }
        }

        // 値の範囲を安全にクリップ
        settings.Hour = Math.Clamp(settings.Hour, 0, 23);
        settings.Minute = Math.Clamp(settings.Minute, 0, 59);

        Serilog.Log.Information("UploadsCleanup: Registering job with UploadsPath={UploadsPath}, TempRetentionHours={TempRetentionHours}, Schedule={Hour}:{Minute:D2}",
            uploadsPath, settings.TempRetentionHours, settings.Hour, settings.Minute);

        recurringJobManager.AddOrUpdate<Pecus.Libs.Hangfire.Tasks.UploadsCleanupTasks>(
            "UploadsCleanup",
            task => task.CleanupUploadsAsync(uploadsPath, settings.TempRetentionHours),
            Cron.Daily(settings.Hour, settings.Minute) // 設定で指定した時刻に実行
        );
    }

    /// <summary>
    /// アジェンダクリーンアップジョブを設定します
    /// </summary>
    /// <param name="recurringJobManager">Hangfire定期ジョブマネージャー</param>
    /// <param name="configuration">設定</param>
    private static void ConfigureAgendaCleanupJob(IRecurringJobManager recurringJobManager, IConfiguration configuration)
    {
        var settings = configuration.GetSection("AgendaCleanup").Get<AgendaCleanupSettings>() ?? new AgendaCleanupSettings();

        if (!settings.Enabled)
        {
            Serilog.Log.Information("AgendaCleanup: Disabled by configuration");
            return;
        }

        // 値の範囲を安全にクリップ
        settings.Hour = Math.Clamp(settings.Hour, 0, 23);
        settings.Minute = Math.Clamp(settings.Minute, 0, 59);

        var batchSize = settings.BatchSize;
        var olderThanDays = settings.OlderThanDays;

        recurringJobManager.AddOrUpdate<Pecus.Libs.Hangfire.Tasks.CleanupTasks>(
            "AgendaCleanup",
            task => task.CleanupOldAgendasAsync(batchSize, olderThanDays),
            Cron.Daily(settings.Hour, settings.Minute)
        );
    }
}