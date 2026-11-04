using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.User;

/// <summary>
/// WebAuthn のクレデンシャル記述子
/// </summary>
public class WebAuthnCredentialDescriptor
{
    /// <summary>
    /// クレデンシャルID（base64url）
    /// </summary>
    [Required]
    public required string Id { get; set; }

    /// <summary>
    /// クレデンシャル種別
    /// </summary>
    public string Type { get; set; } = "public-key";

    /// <summary>
    /// 認証器のトランスポート
    /// </summary>
    public List<string>? Transports { get; set; }
}
