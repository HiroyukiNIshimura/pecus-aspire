namespace Pecus.BackFire.Services;

/// <summary>
/// リフレッシュトークンクリーンアップの設定
/// </summary>
public class RefreshTokenCleanupSettings
{
    /// <summary>
    /// バッチサイズ
    /// </summary>
    public int BatchSize { get; set; } = 1000;

    /// <summary>
    /// 無効化後に残す日数
    /// </summary>
    public int OlderThanDays { get; set; } = 30;

    /// <summary>
    /// 実行時刻の時（0-23）
    /// </summary>
    public int Hour { get; set; } = 2;

    /// <summary>
    /// 実行時刻の分（0-59）
    /// </summary>
    public int Minute { get; set; } = 0;
}

/// <summary>
/// デバイスクリーンアップの設定
/// </summary>
public class DeviceCleanupSettings
{
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
    /// 実行時刻の時（0-23）
    /// </summary>
    public int Hour { get; set; } = 2;

    /// <summary>
    /// 実行時刻の分（0-59）
    /// </summary>
    public int Minute { get; set; } = 30;
}

/// <summary>
/// メールアドレス変更トークンクリーンアップの設定
/// </summary>
public class EmailChangeTokenCleanupSettings
{
    /// <summary>
    /// バッチサイズ
    /// </summary>
    public int BatchSize { get; set; } = 1000;

    /// <summary>
    /// 使用後に残す日数
    /// </summary>
    public int OlderThanDays { get; set; } = 7;

    /// <summary>
    /// 実行時刻の時（0-23）
    /// </summary>
    public int Hour { get; set; } = 3;

    /// <summary>
    /// 実行時刻の分（0-59）
    /// </summary>
    public int Minute { get; set; } = 0;
}

/// <summary>
/// アップロードフォルダクリーンアップの設定
/// </summary>
public class UploadsCleanupSettings
{
    /// <summary>
    /// tempフォルダ内のファイルを保持する時間（時間単位、デフォルト: 24時間）
    /// </summary>
    public int TempRetentionHours { get; set; } = 24;

    /// <summary>
    /// 実行時刻の時（0-23）
    /// </summary>
    public int Hour { get; set; } = 4;

    /// <summary>
    /// 実行時刻の分（0-59）
    /// </summary>
    public int Minute { get; set; } = 0;
}

/// <summary>
/// チャットクリーンアップの設定
/// </summary>
public class ChatCleanupSettings
{
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
    /// 実行時刻の時（0-23）
    /// </summary>
    public int Hour { get; set; } = 5;

    /// <summary>
    /// 実行時刻の分（0-59）
    /// </summary>
    public int Minute { get; set; } = 0;
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