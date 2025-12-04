using Pecus.Libs.DB.Models.Enums;
using Pecus.Models.Responses.Role;
using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.User;

/// <summary>
/// ログインレスポンス
/// </summary>
public class LoginResponse
{
    /// <summary>
    /// JWTアクセストークン
    /// </summary>
    [Required]
    public required string AccessToken { get; set; }

    /// <summary>
    /// トークンタイプ（常に "Bearer"）
    /// </summary>
    public string TokenType { get; set; } = "Bearer";

    /// <summary>
    /// トークンの有効期限（UTC）
    /// </summary>
    public DateTimeOffset ExpiresAt { get; set; }

    /// <summary>
    /// トークンの有効時間（秒）
    /// </summary>
    public int ExpiresIn { get; set; }

    /// <summary>
    /// ユーザーID
    /// </summary>
    public int UserId { get; set; }

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
    public AvatarType? AvatarType { get; set; }

    /// <summary>
    /// アイデンティティアイコンURL
    /// </summary>
    public string? IdentityIconUrl { get; set; }

    /// <summary>
    /// ユーザーが持つロール一覧
    /// </summary>
    public List<RoleInfoResponse> Roles { get; set; } = new();

    /// <summary>
    /// リフレッシュトークン
    /// </summary>
    public string? RefreshToken { get; set; }

    /// <summary>
    /// リフレッシュトークンの有効期限（UTC）
    /// </summary>
    public DateTimeOffset? RefreshExpiresAt { get; set; }
}