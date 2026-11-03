using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.User;

/// <summary>
/// PublicKeyCredentialRequestOptions（パスキー認証）
/// </summary>
public class WebAuthnRequestOptions
{
    /// <summary>
    /// チャレンジ（base64url）
    /// </summary>
    [Required]
    public required string Challenge { get; set; }

    /// <summary>
    /// Relying Party ID
    /// </summary>
    [Required]
    public required string RpId { get; set; }

    /// <summary>
    /// タイムアウト（ミリ秒）
    /// </summary>
    public long Timeout { get; set; }

    /// <summary>
    /// 許可するクレデンシャル（空の場合は discoverable credentials）
    /// </summary>
    public List<WebAuthnCredentialDescriptor> AllowCredentials { get; set; } = new();

    /// <summary>
    /// ユーザー検証の要求レベル
    /// </summary>
    public string? UserVerification { get; set; }
}
