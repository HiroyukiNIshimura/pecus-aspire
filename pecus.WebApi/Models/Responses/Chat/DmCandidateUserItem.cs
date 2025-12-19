using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.Chat;

/// <summary>
/// DM候補ユーザー項目（既存DMがないアクティブユーザー）
/// </summary>
public class DmCandidateUserItem
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
    /// 最終アクティブ日時（最終ログイン日時）
    /// </summary>
    public DateTime? LastActiveAt { get; set; }
}
