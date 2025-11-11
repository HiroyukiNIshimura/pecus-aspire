using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests;

/// <summary>
/// メールアドレス変更リクエスト
/// </summary>
public class RequestEmailChangeRequest
{
    /// <summary>
    /// 新しいメールアドレス
    /// </summary>
    [Required(ErrorMessage = "新しいメールアドレスは必須です。")]
    [EmailAddress(ErrorMessage = "有効なメールアドレス形式で入力してください。")]
    [MaxLength(254, ErrorMessage = "メールアドレスは254文字以内で入力してください。")]
    public required string NewEmail { get; set; }

    /// <summary>
    /// 現在のパスワード（本人確認用）
    /// </summary>
    [Required(ErrorMessage = "現在のパスワードは必須です。")]
    [StringLength(100, MinimumLength = 8, ErrorMessage = "パスワードは8〜100文字で入力してください。")]
    public required string CurrentPassword { get; set; }
}

/// <summary>
/// メールアドレス変更確認リクエスト
/// </summary>
public class VerifyEmailChangeRequest
{
    /// <summary>
    /// 確認トークン（メールで送信されたもの）
    /// </summary>
    [Required(ErrorMessage = "確認トークンは必須です。")]
    [MaxLength(64, ErrorMessage = "トークンの形式が正しくありません。")]
    public required string Token { get; set; }
}
