namespace Pecus.Libs.Mail.Templates.Models;

/// <summary>
/// セキュリティ通知メールテンプレート用のモデル
/// </summary>
public class SecurityNotificationEmailModel
{
    /// <summary>
    /// ユーザー名
    /// </summary>
    public string UserName { get; set; } = string.Empty;

    /// <summary>
    /// メールアドレス
    /// </summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// デバイス名
    /// </summary>
    public string DeviceName { get; set; } = string.Empty;

    /// <summary>
    /// デバイスタイプ
    /// </summary>
    public string DeviceType { get; set; } = string.Empty;

    /// <summary>
    /// OS情報
    /// </summary>
    public string? OS { get; set; }

    /// <summary>
    /// IPアドレス
    /// </summary>
    public string? IpAddress { get; set; }

    /// <summary>
    /// タイムゾーン
    /// </summary>
    public string? Timezone { get; set; }

    /// <summary>
    /// ログイン日時
    /// </summary>
    public DateTimeOffset LoginAt { get; set; } = DateTimeOffset.UtcNow;

    /// <summary>
    /// セキュリティ設定URL
    /// </summary>
    public string SecuritySettingsUrl { get; set; } = string.Empty;
}