using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.User;

/// <summary>
/// パスワードなしユーザー登録リクエスト（管理者用）
/// </summary>
public class CreateUserWithoutPasswordRequest
{
    [Required(ErrorMessage = "ユーザー名は必須です。")]
    [MaxLength(50, ErrorMessage = "ユーザー名は50文字以内で入力してください。")]
    public required string Username { get; set; }

    [Required(ErrorMessage = "メールアドレスは必須です。")]
    [EmailAddress(ErrorMessage = "有効なメールアドレス形式で入力してください。")]
    [MaxLength(100, ErrorMessage = "メールアドレスは100文字以内で入力してください。")]
    public required string Email { get; set; }

    [Required(ErrorMessage = "ロールIDリストは必須です。")]
    public required List<int> Roles { get; set; }
}
