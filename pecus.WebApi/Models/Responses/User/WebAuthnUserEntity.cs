using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.User;

/// <summary>
/// WebAuthn のユーザー情報
/// </summary>
public class WebAuthnUserEntity
{
    /// <summary>
    /// ユーザーハンドル（base64url、不変）
    /// </summary>
    [Required]
    public required string Id { get; set; }

    /// <summary>
    /// ユーザー名（メールアドレス）
    /// </summary>
    [Required]
    public required string Name { get; set; }

    /// <summary>
    /// 表示名
    /// </summary>
    [Required]
    public required string DisplayName { get; set; }
}
