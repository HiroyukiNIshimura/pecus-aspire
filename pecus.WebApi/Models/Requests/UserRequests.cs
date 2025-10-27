using Pecus.Models.Validation;
using System.ComponentModel.DataAnnotations;

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
/// パスワードなしユーザー登録リクエスト（管理者用）
/// </summary>
public class CreateUserWithoutPasswordRequest
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
}

/// <summary>
/// ユーザーパスワード設定リクエスト
/// </summary>
public class SetUserPasswordRequest
{
    /// <summary>
    /// パスワード設定トークン（メールで送信されたもの）
    /// </summary>
    [Required(ErrorMessage = "トークンは必須です。")]
    public required string Token { get; set; }

    /// <summary>
    /// 新しいパスワード
    /// </summary>
    [Required(ErrorMessage = "パスワードは必須です。")]
    [StringLength(
        100,
        MinimumLength = 6,
        ErrorMessage = "パスワードは6文字以上100文字以内で入力してください。"
    )]
    public required string Password { get; set; }
}

/// <summary>
/// パスワードリセットリクエスト
/// </summary>
public class RequestPasswordResetRequest
{
    /// <summary>
    /// メールアドレス
    /// </summary>
    [Required(ErrorMessage = "メールアドレスは必須です。")]
    [EmailAddress(ErrorMessage = "有効なメールアドレス形式で入力してください。")]
    [StringLength(100, ErrorMessage = "メールアドレスは100文字以内で入力してください。")]
    public required string Email { get; set; }
}

/// <summary>
/// パスワードリセット実行リクエスト
/// </summary>
public class ResetPasswordRequest
{
    /// <summary>
    /// パスワードリセットトークン（メールで送信されたもの）
    /// </summary>
    [Required(ErrorMessage = "トークンは必須です。")]
    public required string Token { get; set; }

    /// <summary>
    /// 新しいパスワード
    /// </summary>
    [Required(ErrorMessage = "パスワードは必須です。")]
    [StringLength(
        100,
        MinimumLength = 6,
        ErrorMessage = "パスワードは6文字以上100文字以内で入力してください。"
    )]
    public required string Password { get; set; }
}

/// <summary>
/// ユーザー更新リクエスト
/// </summary>
public class UpdateUserRequest
{
    /// <summary>
    /// ユーザー名
    /// </summary>
    public string? Username { get; set; }

    /// <summary>
    /// アバタータイプ
    /// </summary>
    public string? AvatarType { get; set; }

    /// <summary>
    /// アバターURL
    /// </summary>
    public string? AvatarUrl { get; set; }
}

/// <summary>
/// プロフィール更新リクエスト
/// </summary>
public class UpdateProfileRequest
{
    /// <summary>
    /// ユーザー名
    /// </summary>
    public string? Username { get; set; }

    /// <summary>
    /// アバタータイプ
    /// </summary>
    public string? AvatarType { get; set; }

    /// <summary>
    /// アバターURL
    /// </summary>
    public string? AvatarUrl { get; set; }

    /// <summary>
    /// スキルIDリスト
    /// </summary>
    public List<int>? SkillIds { get; set; }
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
