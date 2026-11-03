using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.User;

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
    /// <remarks>
    /// パスワードが未設定のユーザー（パスキー専用の組織）は省略できる。
    /// 本人性はログイン済みセッションと、新しいメールアドレス宛の確認メールで担保する。
    /// </remarks>
    [MaxLength(100, ErrorMessage = "パスワードは100文字以内で入力してください。")]
    public string? CurrentPassword { get; set; }
}