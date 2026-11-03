using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.User;

/// <summary>
/// リカバリーコードの検証リクエスト
/// </summary>
public class WebAuthnRecoveryCodeRequest
{
    /// <summary>
    /// ログインIDまたはメールアドレス
    /// </summary>
    [Required(ErrorMessage = "ログイン識別子は必須です。")]
    [MaxLength(255, ErrorMessage = "ログイン識別子は255文字以内で入力してください。")]
    public required string LoginIdentifier { get; set; }

    /// <summary>
    /// リカバリーコード
    /// </summary>
    [Required(ErrorMessage = "リカバリーコードは必須です。")]
    [MaxLength(32, ErrorMessage = "リカバリーコードは32文字以内で入力してください。")]
    public required string Code { get; set; }
}
