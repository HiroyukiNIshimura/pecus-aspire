using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.User;

/// <summary>
/// ユーザーリスト項目レスポンス
/// </summary>
public class UserListItemResponse
{
    /// <summary>
    /// ユーザーID
    /// </summary>
    [Required]
    public required int Id { get; set; }

    /// <summary>
    /// ログインID
    /// </summary>
    [Required]
    public required string LoginId { get; set; }

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
    public string AvatarType { get; set; } = "auto-generated";

    /// <summary>
    /// アイデンティティアイコンURL
    /// </summary>
    public string? IdentityIconUrl { get; set; }

    /// <summary>
    /// アクティブフラグ
    /// </summary>
    public bool IsActive { get; set; }

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// 最終ログイン日時
    /// </summary>
    public DateTime? LastLoginAt { get; set; }

    /// <summary>
    /// ユーザーが持つロール数
    /// </summary>
    public int RoleCount { get; set; }
}

