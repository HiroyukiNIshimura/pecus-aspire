using Pecus.Libs.DB.Models.Enums;
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

    /// <summary>
    /// ロールIDのリスト。既存のすべてのロールを置き換えます。
    /// 空のリストまたはnullの場合はすべてのロールを削除します。
    /// </summary>
    [Required(ErrorMessage = "ロールIDリストは必須です。")]
    public required List<int> Roles { get; set; }
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
    [StringLength(100, MinimumLength = 8, ErrorMessage = "パスワードは8〜100文字で入力してください。")]
    [RegularExpression(
        @"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$",
        ErrorMessage = "パスワードは大文字・小文字・数字を含む8文字以上で設定してください。"
    )]
    public required string Password { get; set; }

    /// <summary>
    /// すべてのデバイスのログイン状態をリセットするかどうか
    /// </summary>
    public bool? ResetAllDeviceSessions { get; set; }
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
    [StringLength(100, MinimumLength = 8, ErrorMessage = "パスワードは8〜100文字で入力してください。")]
    [RegularExpression(
        @"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$",
        ErrorMessage = "パスワードは大文字・小文字・数字を含む8文字以上で設定してください。"
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

    [EnumDataType(typeof(AvatarType), ErrorMessage = "有効なアバタータイプを指定してください。")]
    public AvatarType? AvatarType { get; set; }

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
    [EnumDataType(typeof(AvatarType), ErrorMessage = "有効なアバタータイプを指定してください。")]
    public AvatarType? AvatarType { get; set; }

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

    /// <summary>
    /// ユーザーの楽観的ロック用のRowVersion
    /// </summary>
    [Required(ErrorMessage = "RowVersionは必須です。")]
    public required byte[] RowVersion { get; set; }

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

    /// <summary>
    /// デバイス名（ユーザーが任意で付ける表示名）
    /// </summary>
    [MaxLength(100, ErrorMessage = "デバイス名は100文字以内で入力してください。")]
    public string? DeviceName { get; set; }

    /// <summary>
    /// デバイスタイプ
    /// </summary>
    [Required(ErrorMessage = "デバイスタイプは必須です。")]
    [EnumDataType(typeof(DeviceType), ErrorMessage = "有効なデバイスタイプを指定してください。")]
    public required DeviceType DeviceType { get; set; }

    /// <summary>
    /// OSプラットフォーム
    /// </summary>
    [Required(ErrorMessage = "OSプラットフォームは必須です。")]
    [EnumDataType(typeof(OSPlatform), ErrorMessage = "有効なOSプラットフォームを指定してください。")]
    public required OSPlatform OS { get; set; }

    /// <summary>
    /// ユーザーエージェント情報
    /// </summary>
    [MaxLength(200, ErrorMessage = "ユーザーエージェント情報は200文字以内で入力してください。")]
    public string? UserAgent { get; set; }

    /// <summary>
    /// アプリバージョン
    /// </summary>
    [MaxLength(50, ErrorMessage = "アプリバージョンは50文字以内で入力してください。")]
    public string? AppVersion { get; set; }

    /// <summary>
    /// タイムゾーン
    /// </summary>
    [MaxLength(50, ErrorMessage = "タイムゾーンは50文字以内で入力してください。")]
    public string? Timezone { get; set; }

    /// <summary>
    /// ログイン位置情報更新リクエスト
    /// </summary>
    [MaxLength(200, ErrorMessage = "Locationは200文字以内で入力してください。")]
    public string? Location { get; set; }

    /// <summary>
    /// IPアドレス
    /// </summary>
    [MaxLength(45, ErrorMessage = "IPアドレスは45文字以内で入力してください。")]
    public string? IpAddress { get; set; }
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
    /// ロールIDのリスト。既存のすべてのロールを置き換えます。
    /// 空のリストまたはnullの場合はすべてのロールを削除します。
    /// </summary>
    [Required(ErrorMessage = "ロールIDリストは必須です。")]
    [IntListRange(1, 5)]
    public required List<int> Roles { get; set; }

    /// <summary>
    /// ユーザーの楽観的ロック用RowVersion。
    /// 競合検出に使用されます。設定されている場合、ユーザーのRowVersionをチェックします。
    /// </summary>
    public byte[]? UserRowVersion { get; set; }
}

/// <summary>
/// パスワード変更リクエスト
/// </summary>
public class UpdatePasswordRequest
{
    /// <summary>
    /// 現在のパスワード（確認用）
    /// </summary>
    [Required(ErrorMessage = "現在のパスワードは必須です。")]
    [StringLength(100, MinimumLength = 8, ErrorMessage = "パスワードは8〜100文字で入力してください。")]
    public required string CurrentPassword { get; set; }

    /// <summary>
    /// 新しいパスワード
    /// </summary>
    [Required(ErrorMessage = "新しいパスワードは必須です。")]
    [StringLength(100, MinimumLength = 8, ErrorMessage = "パスワードは8〜100文字で入力してください。")]
    [RegularExpression(
        @"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$",
        ErrorMessage = "パスワードは大文字・小文字・数字を含む8文字以上で設定してください。"
    )]
    public required string NewPassword { get; set; }
}

/// <summary>
/// ユーザーのアクティブ状態設定リクエスト
/// </summary>
public class SetUserActiveStatusRequest
{
    /// <summary>
    /// アクティブ状態（true: 有効, false: 無効）
    /// </summary>
    public required bool IsActive { get; set; }
}

/// <summary>
/// ユーザーのスキル設定リクエスト
/// </summary>
public class SetUserSkillsRequest
{
    /// <summary>
    /// スキルIDのリスト。既存のすべてのスキルを置き換えます。
    /// 空のリストまたはnullの場合はすべてのスキルを削除します。
    /// </summary>
    [Required(ErrorMessage = "スキルIDのリストは必須です。")]
    public required List<int> SkillIds { get; set; }

    /// <summary>
    /// ユーザーの楽観的ロック用RowVersion。
    /// 競合検出に使用されます。設定されている場合、ユーザーのRowVersionをチェックします。
    /// </summary>
    public byte[]? UserRowVersion { get; set; }
}
