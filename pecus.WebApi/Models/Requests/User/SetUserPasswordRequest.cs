using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.User;

/// <summary>
/// ユーザーパスワード設定リクエスト
/// </summary>
public class SetUserPasswordRequest
{
    [Required(ErrorMessage = "トークンは必須です。")]
    public required string Token { get; set; }

    [Required(ErrorMessage = "パスワードは必須です。")]
    [StringLength(100, MinimumLength = 8, ErrorMessage = "パスワードは8〜100文字で入力してください。")]
    [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$", ErrorMessage = "パスワードは大文字・小文字・数字を含む8文字以上で設定してください。")]
    public required string Password { get; set; }

    public bool? ResetAllDeviceSessions { get; set; }
}