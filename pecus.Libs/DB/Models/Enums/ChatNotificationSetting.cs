namespace Pecus.Libs.DB.Models.Enums;

/// <summary>
/// チャット通知設定
/// </summary>
public enum ChatNotificationSetting
{
    /// <summary>
    /// すべての通知を受け取る
    /// </summary>
    All = 0,

    /// <summary>
    /// メンション時のみ通知
    /// </summary>
    MentionsOnly = 1,

    /// <summary>
    /// 通知オフ（ミュート）
    /// </summary>
    Muted = 2,
}