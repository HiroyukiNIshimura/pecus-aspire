using Pecus.Libs.DB.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.Chat;

/// <summary>
/// チャットルームメンバー項目
/// </summary>
public class ChatRoomMemberItem : UserIdentityResponse
{
    /// <summary>
    /// メールアドレス
    /// </summary>
    [Required]
    public required string Email { get; set; }

    /// <summary>
    /// ロール
    /// </summary>
    [Required]
    public required ChatRoomRole Role { get; set; }

    /// <summary>
    /// 参加日時
    /// </summary>
    public DateTimeOffset JoinedAt { get; set; }

    /// <summary>
    /// 最終既読日時
    /// </summary>
    public DateTimeOffset? LastReadAt { get; set; }
}