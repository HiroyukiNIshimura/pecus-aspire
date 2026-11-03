using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.User;

/// <summary>
/// パスキー登録の検証リクエスト
/// </summary>
public class WebAuthnRegistrationRequest
{
    /// <summary>
    /// オプション取得時に発行されたチャレンジID（ワンタイム）
    /// </summary>
    [Required(ErrorMessage = "チャレンジIDは必須です。")]
    public required string ChallengeId { get; set; }

    /// <summary>
    /// クレデンシャルID（base64url）
    /// </summary>
    [Required(ErrorMessage = "クレデンシャルIDは必須です。")]
    public required string Id { get; set; }

    /// <summary>
    /// クレデンシャルID（base64url、Id と同値）
    /// </summary>
    [Required(ErrorMessage = "RawIdは必須です。")]
    public required string RawId { get; set; }

    /// <summary>
    /// クレデンシャル種別
    /// </summary>
    public string Type { get; set; } = "public-key";

    /// <summary>
    /// 認証器の応答
    /// </summary>
    [Required(ErrorMessage = "認証器の応答は必須です。")]
    public required WebAuthnAttestationResponseData Response { get; set; }

    /// <summary>
    /// パスキーの表示名（省略時は端末名や既定名を使用）
    /// </summary>
    [MaxLength(100, ErrorMessage = "表示名は100文字以内で入力してください。")]
    public string? Name { get; set; }

    /// <summary>
    /// 紐づける端末ID（任意）
    /// </summary>
    public int? DeviceId { get; set; }
}
