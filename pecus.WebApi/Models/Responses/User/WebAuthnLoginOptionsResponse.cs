using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.User;

/// <summary>
/// パスキーログイン用オプション
/// </summary>
public class WebAuthnLoginOptionsResponse
{
    /// <summary>
    /// チャレンジID（検証時に送り返すワンタイム識別子）
    /// </summary>
    [Required]
    public required string ChallengeId { get; set; }

    /// <summary>
    /// PublicKeyCredentialRequestOptions
    /// </summary>
    [Required]
    public required WebAuthnRequestOptions PublicKey { get; set; }
}
