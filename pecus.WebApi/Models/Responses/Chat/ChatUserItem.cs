using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.Chat;

/// <summary>
/// チャットユーザー項目（簡易版）
/// </summary>
public class ChatUserItem
{
    /// <summary>
    /// ユーザーID
    /// </summary>
    [Required]
    public required int Id { get; set; }

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
    /// アクティブフラグ（false の場合は退会済み/無効化されたユーザー）
    /// </summary>
    public bool IsActive { get; set; }
}
