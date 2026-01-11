using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.Chat;

/// <summary>
/// 未読数レスポンス
/// </summary>
public class ChatUnreadCountResponse
{
    /// <summary>
    /// 全体の未読メッセージ数
    /// </summary>
    [Required]
    public required int TotalUnreadCount { get; set; }
}

/// <summary>
/// カテゴリ別未読数レスポンス
/// </summary>
public class ChatUnreadCountByCategoryResponse
{
    /// <summary>
    /// 全体の未読メッセージ数
    /// </summary>
    [Required]
    public required int TotalUnreadCount { get; set; }

    /// <summary>
    /// DM の未読数
    /// </summary>
    [Required]
    public required int DmUnreadCount { get; set; }

    /// <summary>
    /// グループチャットの未読数
    /// </summary>
    [Required]
    public required int GroupUnreadCount { get; set; }

    /// <summary>
    /// AI チャットの未読数
    /// </summary>
    [Required]
    public required int AiUnreadCount { get; set; }

    /// <summary>
    /// システム通知の未読数
    /// </summary>
    [Required]
    public required int SystemUnreadCount { get; set; }
}