namespace Pecus.BackFire.Services;

/// <summary>
/// リフレッシュトークンクリーンアップの設定
/// </summary>
public class RefreshTokenCleanupSettings
{
    /// <summary>
    /// ジョブを有効にするかどうか
    /// </summary>
    public bool Enabled { get; set; } = true;

    /// <summary>
    /// バッチサイズ
    /// </summary>
    public int BatchSize { get; set; } = 1000;

    /// <summary>
    /// 無効化後に残す日数
    /// </summary>
    public int OlderThanDays { get; set; } = 30;

    /// <summary>
    /// Cron式（デフォルト: 毎日2:00）
    /// </summary>
    public string CronExpression { get; set; } = "0 2 * * *";
}

/// <summary>
/// デバイスクリーンアップの設定
/// </summary>
public class DeviceCleanupSettings
{
    /// <summary>
    /// ジョブを有効にするかどうか
    /// </summary>
    public bool Enabled { get; set; } = true;

    /// <summary>
    /// バッチサイズ
    /// </summary>
    public int BatchSize { get; set; } = 1000;

    /// <summary>
    /// 無効化後に残す日数
    /// </summary>
    public int OlderThanDays { get; set; } = 30;

    /// <summary>
    /// 有効なデバイスでも削除する古さの日数
    /// </summary>
    public int VeryOldDays { get; set; } = 365;

    /// <summary>
    /// Cron式（デフォルト: 毎日2:30）
    /// </summary>
    public string CronExpression { get; set; } = "30 2 * * *";
}

/// <summary>
/// メールアドレス変更トークンクリーンアップの設定
/// </summary>
public class EmailChangeTokenCleanupSettings
{
    /// <summary>
    /// ジョブを有効にするかどうか
    /// </summary>
    public bool Enabled { get; set; } = true;

    /// <summary>
    /// バッチサイズ
    /// </summary>
    public int BatchSize { get; set; } = 1000;

    /// <summary>
    /// 使用後に残す日数
    /// </summary>
    public int OlderThanDays { get; set; } = 7;

    /// <summary>
    /// Cron式（デフォルト: 毎日3:00）
    /// </summary>
    public string CronExpression { get; set; } = "0 3 * * *";
}

/// <summary>
/// アップロードフォルダクリーンアップの設定
/// </summary>
public class UploadsCleanupSettings
{
    /// <summary>
    /// ジョブを有効にするかどうか
    /// </summary>
    public bool Enabled { get; set; } = true;

    /// <summary>
    /// tempフォルダ内のファイルを保持する時間（時間単位、デフォルト: 24時間）
    /// </summary>
    public int TempRetentionHours { get; set; } = 24;

    /// <summary>
    /// Cron式（デフォルト: 毎日4:00）
    /// </summary>
    public string CronExpression { get; set; } = "0 4 * * *";
}

/// <summary>
/// チャットクリーンアップの設定
/// </summary>
public class ChatCleanupSettings
{
    /// <summary>
    /// ジョブを有効にするかどうか
    /// </summary>
    public bool Enabled { get; set; } = true;

    /// <summary>
    /// バッチサイズ
    /// </summary>
    public int BatchSize { get; set; } = 1000;

    /// <summary>
    /// システムチャットの設定
    /// </summary>
    public ChatTypeSettings System { get; set; } = new ChatTypeSettings();

    /// <summary>
    /// グループチャットの設定
    /// </summary>
    /// <returns></returns>
    public ChatTypeSettings Group { get; set; } = new ChatTypeSettings();

    /// <summary>
    /// ダイレクトチャットの設定
    /// </summary>
    public ChatTypeSettings Dm { get; set; } = new ChatTypeSettings();

    /// <summary>
    /// ボットチャットの設定
    /// </summary>
    public ChatTypeSettings Ai { get; set; } = new ChatTypeSettings();

    /// <summary>
    /// Cron式（デフォルト: 毎日5:00）
    /// </summary>
    public string CronExpression { get; set; } = "0 5 * * *";
}

/// <summary>
///  ChatRoomTypeごとのクリーンアップ設定
/// </summary>
public class ChatTypeSettings
{
    /// <summary>
    /// 古いチャットメッセージを削除する日数
    /// </summary>
    public int OlderThanDays { get; set; } = 90;

}

/// <summary>
/// アジェンダクリーンアップの設定
/// </summary>
public class AgendaCleanupSettings
{
    /// <summary>
    /// バッチサイズ
    /// </summary>
    public int BatchSize { get; set; } = 1000;

    /// <summary>
    /// 有効フラグ
    /// </summary>
    public bool Enabled { get; set; } = true;

    /// <summary>
    /// 終了後に残す日数（この日数より古いアジェンダを削除）
    /// </summary>
    public int OlderThanDays { get; set; } = 2;

    /// <summary>
    /// Cron式（デフォルト: 毎日6:00）
    /// </summary>
    public string CronExpression { get; set; } = "0 6 * * *";
}

/// <summary>
/// 失効済みAPIキークリーンアップの設定
/// </summary>
public class ExternalApiKeyCleanupSettings
{
    /// <summary>
    /// ジョブを有効にするかどうか
    /// </summary>
    public bool Enabled { get; set; } = true;

    /// <summary>
    /// バッチサイズ
    /// </summary>
    public int BatchSize { get; set; } = 1000;

    /// <summary>
    /// 失効後に残す日数（この日数より古いものを削除）
    /// </summary>
    public int OlderThanDays { get; set; } = 30;

    /// <summary>
    /// Cron式（デフォルト: 毎日2:00）
    /// </summary>
    public string CronExpression { get; set; } = "0 2 * * *";
}