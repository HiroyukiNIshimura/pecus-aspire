using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.User;

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
