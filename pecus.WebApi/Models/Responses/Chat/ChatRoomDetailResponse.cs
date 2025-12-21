using Pecus.Libs.DB.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.Chat;

/// <summary>
/// チャットルーム詳細レスポンス
/// </summary>
public class ChatRoomDetailResponse
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
    /// ルーム名
    /// </summary>
    public string? Name { get; set; }

    /// <summary>
    /// ワークスペースID（ワークスペースグループチャットの場合）
    /// </summary>
    public int? WorkspaceId { get; set; }

    /// <summary>
    /// ルームメンバー一覧
    /// </summary>
    [Required]
    public required List<ChatRoomMemberItem> Members { get; set; }

    /// <summary>
    /// 通知設定
    /// </summary>
    [Required]
    public required ChatNotificationSetting NotificationSetting { get; set; }

    /// <summary>
    /// 既読位置
    /// </summary>
    public DateTimeOffset? LastReadAt { get; set; }

    /// <summary>
    /// RowVersion（楽観的ロック用）
    /// </summary>
    [Required]
    public required uint RowVersion { get; set; }

    /// <summary>
    /// ルーム作成日時
    /// </summary>
    public DateTimeOffset CreatedAt { get; set; }

    /// <summary>
    /// ルーム更新日時
    /// </summary>
    public DateTimeOffset? UpdatedAt { get; set; }
}