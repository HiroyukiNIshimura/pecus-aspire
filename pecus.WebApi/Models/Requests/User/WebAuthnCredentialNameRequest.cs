using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.User;

/// <summary>
/// パスキーの表示名変更リクエスト
/// </summary>
public class WebAuthnCredentialNameRequest
{
    /// <summary>
    /// 新しい表示名
    /// </summary>
    [Required(ErrorMessage = "表示名は必須です。")]
    [MaxLength(100, ErrorMessage = "表示名は100文字以内で入力してください。")]
    public required string Name { get; set; }
}
