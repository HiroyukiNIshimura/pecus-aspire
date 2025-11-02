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
    [MaxLength(50, ErrorMessage = "ユーザー名は50文字以内で入力してください。")]
    public required string Username { get; set; }

    /// <summary>
    /// メールアドレス
    /// </summary>
    [Required(ErrorMessage = "メールアドレスは必須です。")]
    [EmailAddress(ErrorMessage = "有効なメールアドレス形式で入力してください。")]
    [MaxLength(100, ErrorMessage = "メールアドレスは100文字以内で入力してください。")]
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
    [MaxLength(50, ErrorMessage = "ユーザー名は50文字以内で入力してください。")]
    public required string Username { get; set; }

    /// <summary>
    /// メールアドレス
    /// </summary>
    [Required(ErrorMessage = "メールアドレスは必須です。")]
    [EmailAddress(ErrorMessage = "有効なメールアドレス形式で入力してください。")]
    [MaxLength(100, ErrorMessage = "メールアドレスは100文字以内で入力してください。")]
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
    [MaxLength(100, ErrorMessage = "メールアドレスは100文字以内で入力してください。")]
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
    [MaxLength(50, ErrorMessage = "ユーザー名は50文字以内で入力してください。")]
    public string? Username { get; set; }

    /// <summary>
    /// アバタータイプ
    /// </summary>
    [AvatarType]
    public string? AvatarType { get; set; }

    /// <summary>
    /// アバターURL
    /// </summary>
    [MaxLength(200, ErrorMessage = "アバターURLは200文字以内で入力してください。")]
    [Url(ErrorMessage = "有効なURLを指定してください。")]
    public string? AvatarUrl { get; set; }

    /// <summary>
    /// アクティブフラグ
    /// </summary>
    public bool? IsActive { get; set; }
}

/// <summary>
/// プロフィール更新リクエスト
/// </summary>
public class UpdateProfileRequest
{
    /// <summary>
    /// ユーザー名
    /// </summary>
    [MaxLength(50, ErrorMessage = "ユーザー名は50文字以内で入力してください。")]
    public string? Username { get; set; }

    /// <summary>
    /// アバタータイプ
    /// </summary>
    [AvatarType]
    public string? AvatarType { get; set; }

    /// <summary>
    /// アバターURL
    /// </summary>
    [MaxLength(200, ErrorMessage = "アバターURLは200文字以内で入力してください。")]
    [Url(ErrorMessage = "有効なURLを指定してください。")]
    public string? AvatarUrl { get; set; }

    /// <summary>
    /// スキルIDリスト
    /// </summary>
    [IntListRange(1, 50)]
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

/// <summary>
/// メールアドレス変更リクエスト
/// </summary>
public class UpdateEmailRequest
{
    /// <summary>
    /// 新しいメールアドレス
    /// </summary>
    [Required(ErrorMessage = "新しいメールアドレスは必須です。")]
    [EmailAddress(ErrorMessage = "有効なメールアドレス形式で入力してください。")]
    [MaxLength(100, ErrorMessage = "メールアドレスは100文字以内で入力してください。")]
    public required string NewEmail { get; set; }
}

/// <summary>
/// ユーザーロール設定リクエスト
/// </summary>
public class SetUserRolesRequest
{
    /// <summary>
    /// ロールIDのリスト
    /// </summary>
    [Required(ErrorMessage = "ロールIDリストは必須です。")]
    public required List<int> RoleIds { get; set; }
}
