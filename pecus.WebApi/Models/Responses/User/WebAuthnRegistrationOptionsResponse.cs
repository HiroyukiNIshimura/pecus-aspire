using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.User;

/// <summary>
/// パスキー登録用オプション
/// </summary>
public class WebAuthnRegistrationOptionsResponse
{
    /// <summary>
    /// チャレンジID（検証時に送り返すワンタイム識別子）
    /// </summary>
    [Required]
    public required string ChallengeId { get; set; }

    /// <summary>
    /// PublicKeyCredentialCreationOptions
    /// </summary>
    [Required]
    public required WebAuthnCreationOptions PublicKey { get; set; }
}
