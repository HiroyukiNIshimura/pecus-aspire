using Pecus.Libs.DB.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.Chat;

/// <summary>
/// チャットルームメンバー項目
/// </summary>
public class ChatRoomMemberItem
{
    /// <summary>
    /// ユーザーID
    /// </summary>
    [Required]
    public required int UserId { get; set; }

    /// <summary>
    /// ユーザー名
    /// </summary>
    [Required]
    public required string Username { get; set; }

    /// <summary>
    /// メールアドレス
    /// </summary>
    [Required]
    public required string Email { get; set; }

    /// <summary>
    /// アバタータイプ
    /// </summary>
    public string? AvatarType { get; set; }

    /// <summary>
    /// アイデンティティアイコンURL
    /// </summary>
    public string? IdentityIconUrl { get; set; }

    /// <summary>
    /// ロール
    /// </summary>
    [Required]
    public required ChatRoomRole Role { get; set; }

    /// <summary>
    /// 参加日時
    /// </summary>
    public DateTimeOffset JoinedAt { get; set; }
}
