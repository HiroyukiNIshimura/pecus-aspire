using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.User;

/// <summary>
/// パスワード変更リクエスト
/// </summary>
public class UpdatePasswordRequest
{
    [Required(ErrorMessage = "現在のパスワードは必須です。")]
    [StringLength(100, MinimumLength = 8, ErrorMessage = "パスワードは8〜100文字で入力してください。")]
    public required string CurrentPassword { get; set; }

    [Required(ErrorMessage = "新しいパスワードは必須です。")]
    [StringLength(100, MinimumLength = 8, ErrorMessage = "パスワードは8〜100文字で入力してください。")]
    [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$", ErrorMessage = "パスワードは大文字・小文字・数字を含む8文字以上で設定してください。")]
    public required string NewPassword { get; set; }
}