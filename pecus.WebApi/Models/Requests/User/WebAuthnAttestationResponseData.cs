using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.User;

/// <summary>
/// 認証器のアテステーション応答データ
/// </summary>
public class WebAuthnAttestationResponseData
{
    /// <summary>
    /// アテステーションオブジェクト（base64url）
    /// </summary>
    [Required(ErrorMessage = "アテステーションオブジェクトは必須です。")]
    public required string AttestationObject { get; set; }

    /// <summary>
    /// クライアントデータJSON（base64url）
    /// </summary>
    [Required(ErrorMessage = "クライアントデータは必須です。")]
    public required string ClientDataJson { get; set; }

    /// <summary>
    /// 認証器が申告したトランスポート
    /// </summary>
    public List<string>? Transports { get; set; }
}
