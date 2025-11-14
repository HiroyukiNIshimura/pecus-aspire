using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.User;

/// <summary>
/// パスワードリセットリクエスト
/// </summary>
public class RequestPasswordResetRequest
{
    [Required(ErrorMessage = "メールアドレスは必須です。")]
    [EmailAddress(ErrorMessage = "有効なメールアドレス形式で入力してください。")]
    [MaxLength(100, ErrorMessage = "メールアドレスは100文字以内で入力してください。")]
    public required string Email { get; set; }
}
