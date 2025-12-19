using Pecus.Libs.DB.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.Chat;

/// <summary>
/// チャットルーム一覧項目
/// </summary>
public class ChatRoomItem
{
    /// <summary>
    /// ルームID
    /// </summary>
    [Required]
    public required int Id { get; set; }

    /// <summary>
    /// ルームタイプ
    /// </summary>
    [Required]
    public required ChatRoomType Type { get; set; }

    /// <summary>
    /// ルーム名（DM の場合は相手のユーザー名）
    /// </summary>
    public string? Name { get; set; }

    /// <summary>
    /// ワークスペースID（ワークスペースグループチャットの場合）
    /// </summary>
    public int? WorkspaceId { get; set; }

    /// <summary>
    /// DM の場合の相手ユーザー情報
    /// </summary>
    public ChatUserItem? OtherUser { get; set; }

    /// <summary>
    /// 最新メッセージ
    /// </summary>
    public ChatMessageItem? LatestMessage { get; set; }

    /// <summary>
    /// 未読メッセージ数
    /// </summary>
    public int UnreadCount { get; set; }

    /// <summary>
    /// 通知設定
    /// </summary>
    [Required]
    public required ChatNotificationSetting NotificationSetting { get; set; }

    /// <summary>
    /// ルーム作成日時
    /// </summary>
    public DateTimeOffset CreatedAt { get; set; }

    /// <summary>
    /// ルーム更新日時（最終アクティビティ）
    /// </summary>
    public DateTimeOffset? UpdatedAt { get; set; }
}
