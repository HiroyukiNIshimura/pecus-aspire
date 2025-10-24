using System.ComponentModel.DataAnnotations;
using Pecus.Models.Validation;

namespace Pecus.Models.Requests;

/// <summary>
/// ユーザー登録リクエスト
/// </summary>
public class CreateUserRequest
{
    /// <summary>
    /// ユーザー名
    /// </summary>
    [Required(ErrorMessage = "ユーザー名は必須です。")]
    [StringLength(50, ErrorMessage = "ユーザー名は50文字以内で入力してください。")]
    public required string Username { get; set; }

    /// <summary>
    /// メールアドレス
    /// </summary>
    [Required(ErrorMessage = "メールアドレスは必須です。")]
    [EmailAddress(ErrorMessage = "有効なメールアドレス形式で入力してください。")]
    [StringLength(100, ErrorMessage = "メールアドレスは100文字以内で入力してください。")]
    public required string Email { get; set; }

    /// <summary>
    /// パスワード
    /// </summary>
    [Required(ErrorMessage = "パスワードは必須です。")]
    [StringLength(
        100,
        MinimumLength = 6,
        ErrorMessage = "パスワードは6文字以上100文字以内で入力してください。"
    )]
    public required string Password { get; set; }

    /// <summary>
    /// 組織ID
    /// </summary>
    public int? OrganizationId { get; set; }
}

/// <summary>
/// ユーザー更新リクエスト
/// </summary>
public class UpdateUserRequest
{
    /// <summary>
    /// メールアドレス
    /// </summary>
    [EmailAddress(ErrorMessage = "有効なメールアドレス形式で入力してください。")]
    [StringLength(100, ErrorMessage = "メールアドレスは100文字以内で入力してください。")]
    public string? Email { get; set; }

    /// <summary>
    /// パスワード
    /// </summary>
    [StringLength(
        100,
        MinimumLength = 6,
        ErrorMessage = "パスワードは6文字以上100文字以内で入力してください。"
    )]
    public string? Password { get; set; }

    /// <summary>
    /// アバタータイプ(gravatar, user-avatar, auto-generated)
    /// </summary>
    [StringLength(20, ErrorMessage = "アバタータイプは20文字以内で入力してください。")]
    [AvatarType]
    public string? AvatarType { get; set; }
}

/// <summary>
/// ログインリクエスト
/// </summary>
public class LoginRequest
{
    /// <summary>
    /// ログイン識別子（EmailまたはLoginId）
    /// </summary>
    [Required(ErrorMessage = "ログイン識別子は必須です。")]
    public required string LoginIdentifier { get; set; }

    /// <summary>
    /// パスワード
    /// </summary>
    [Required(ErrorMessage = "パスワードは必須です。")]
    public required string Password { get; set; }
}
