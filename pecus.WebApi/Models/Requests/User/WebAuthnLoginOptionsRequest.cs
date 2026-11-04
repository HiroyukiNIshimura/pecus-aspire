using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.User;

/// <summary>
/// パスキーログイン用オプション取得リクエスト
/// </summary>
public class WebAuthnLoginOptionsRequest
{
    /// <summary>
    /// ログインIDまたはメールアドレス
    /// </summary>
    [Required(ErrorMessage = "ログイン識別子は必須です。")]
    [MaxLength(255, ErrorMessage = "ログイン識別子は255文字以内で入力してください。")]
    public required string LoginIdentifier { get; set; }
}
