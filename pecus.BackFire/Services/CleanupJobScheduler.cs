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
        ConfigureExternalApiKeyCleanupJob(recurringJobManager, configuration);
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

        if (!settings.Enabled)
        {
            recurringJobManager.RemoveIfExists("RefreshTokenCleanup");
            return;
        }

        recurringJobManager.AddOrUpdate<Pecus.Libs.Hangfire.Tasks.CleanupTasks>(
            "RefreshTokenCleanup",
            task => task.CleanupExpiredTokensAsync(settings.BatchSize, settings.OlderThanDays),
            settings.CronExpression
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

        if (!settings.Enabled)
        {
            recurringJobManager.RemoveIfExists("DeviceCleanup");
            return;
        }

        recurringJobManager.AddOrUpdate<Pecus.Libs.Hangfire.Tasks.CleanupTasks>(
            "DeviceCleanup",
            task => task.CleanupOldDevicesAsync(settings.BatchSize, settings.OlderThanDays, settings.VeryOldDays),
            settings.CronExpression
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

        if (!settings.Enabled)
        {
            recurringJobManager.RemoveIfExists("EmailChangeTokenCleanup");
            return;
        }

        recurringJobManager.AddOrUpdate<Pecus.Libs.Hangfire.Tasks.CleanupTasks>(
            "EmailChangeTokenCleanup",
            task => task.CleanupExpiredEmailChangeTokensAsync(settings.BatchSize, settings.OlderThanDays),
            settings.CronExpression
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

        if (!settings.Enabled)
        {
            recurringJobManager.RemoveIfExists("ChatCleanup");
            return;
        }

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
            settings.CronExpression
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

        if (!settings.Enabled)
        {
            recurringJobManager.RemoveIfExists("UploadsCleanup");
            return;
        }

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

        Serilog.Log.Information("UploadsCleanup: Registering job with UploadsPath={UploadsPath}, TempRetentionHours={TempRetentionHours}, CronExpression={CronExpression}",
            uploadsPath, settings.TempRetentionHours, settings.CronExpression);

        recurringJobManager.AddOrUpdate<Pecus.Libs.Hangfire.Tasks.UploadsCleanupTasks>(
            "UploadsCleanup",
            task => task.CleanupUploadsAsync(uploadsPath, settings.TempRetentionHours),
            settings.CronExpression
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
            recurringJobManager.RemoveIfExists("AgendaCleanup");
            Serilog.Log.Information("AgendaCleanup: Disabled by configuration");
            return;
        }

        var batchSize = settings.BatchSize;
        var olderThanDays = settings.OlderThanDays;

        recurringJobManager.AddOrUpdate<Pecus.Libs.Hangfire.Tasks.CleanupTasks>(
            "AgendaCleanup",
            task => task.CleanupOldAgendasAsync(batchSize, olderThanDays),
            settings.CronExpression
        );
    }

    /// <summary>
    /// 失効済みAPIキークリーンアップジョブを設定します
    /// </summary>
    /// <param name="recurringJobManager">Hangfire定期ジョブマネージャー</param>
    /// <param name="configuration">設定</param>
    private static void ConfigureExternalApiKeyCleanupJob(IRecurringJobManager recurringJobManager, IConfiguration configuration)
    {
        var settings = configuration.GetSection("ExternalApiKeyCleanup").Get<ExternalApiKeyCleanupSettings>() ?? new ExternalApiKeyCleanupSettings();

        if (!settings.Enabled)
        {
            recurringJobManager.RemoveIfExists("ExternalApiKeyCleanup");
            return;
        }

        recurringJobManager.AddOrUpdate<Pecus.Libs.Hangfire.Tasks.CleanupTasks>(
            "ExternalApiKeyCleanup",
            task => task.CleanupRevokedExternalApiKeysAsync(settings.BatchSize, settings.OlderThanDays),
            settings.CronExpression
        );
    }
}