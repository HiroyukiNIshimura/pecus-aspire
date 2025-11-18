using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.User;

/// <summary>
/// メールアドレス変更リクエスト
/// </summary>
public class UpdateEmailRequest
{
    [Required(ErrorMessage = "新しいメールアドレスは必須です。")]
    [EmailAddress(ErrorMessage = "有効なメールアドレス形式で入力してください。")]
    [MaxLength(100, ErrorMessage = "メールアドレスは100文字以内で入力してください。")]
    public required string NewEmail { get; set; }
}