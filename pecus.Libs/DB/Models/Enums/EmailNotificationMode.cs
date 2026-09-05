namespace Pecus.Libs.DB.Models.Enums;

/// <summary>
/// メール通知配信モード
/// </summary>
public enum EmailNotificationMode
{
    /// <summary>
    /// 受信しない（システムメールのみ配信）
    /// </summary>
    Off = 0,

    /// <summary>
    /// 重要通知のみ即時受信
    /// </summary>
    ImportantOnly = 1,

    /// <summary>
    /// 標準（推奨）
    /// </summary>
    Standard = 2,

    /// <summary>
    /// カスタム（詳細項目ごとに個別に設定）
    /// </summary>
    Custom = 3,
}