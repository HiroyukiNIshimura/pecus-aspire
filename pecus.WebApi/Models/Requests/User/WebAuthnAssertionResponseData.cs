using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.User;

/// <summary>
/// 認証器のアサーション応答データ
/// </summary>
public class WebAuthnAssertionResponseData
{
    /// <summary>
    /// 認証器データ（base64url）
    /// </summary>
    [Required(ErrorMessage = "認証器データは必須です。")]
    public required string AuthenticatorData { get; set; }

    /// <summary>
    /// 署名（base64url）
    /// </summary>
    [Required(ErrorMessage = "署名は必須です。")]
    public required string Signature { get; set; }

    /// <summary>
    /// クライアントデータJSON（base64url）
    /// </summary>
    [Required(ErrorMessage = "クライアントデータは必須です。")]
    public required string ClientDataJson { get; set; }

    /// <summary>
    /// ユーザーハンドル（base64url、discoverable credentials の場合のみ）
    /// </summary>
    public string? UserHandle { get; set; }
}
