using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.User;

/// <summary>
/// リカバリーコード検証後のパスキー再登録用トークン
/// </summary>
public class WebAuthnRecoveryTokenResponse
{
    /// <summary>
    /// リカバリートークン（有効期限は5分）
    /// </summary>
    [Required]
    public required string RecoveryToken { get; set; }

    /// <summary>
    /// トークンの有効期限
    /// </summary>
    public DateTimeOffset ExpiresAt { get; set; }
}
