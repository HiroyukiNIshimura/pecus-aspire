using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests;

/// <summary>
/// 組織登録リクエスト
/// </summary>
public class CreateOrganizationRequest
{
    /// <summary>
    /// 組織名
    /// </summary>
    [Required(ErrorMessage = "組織名は必須です。")]
    [MaxLength(100, ErrorMessage = "組織名は100文字以内で入力してください。")]
    public required string Name { get; set; }

    /// <summary>
    /// 電話番号
    /// </summary>
    [Required(ErrorMessage = "電話番号は必須です。")]
    [Phone(ErrorMessage = "有効な電話番号形式で入力してください。")]
    [MaxLength(20, ErrorMessage = "電話番号は20文字以内で入力してください。")]
    public required string PhoneNumber { get; set; }

    /// <summary>
    /// 組織コード
    /// </summary>
    [MaxLength(50, ErrorMessage = "組織コードは50文字以内で入力してください。")]
    public string? Code { get; set; }

    /// <summary>
    /// 組織の説明
    /// </summary>
    [MaxLength(500, ErrorMessage = "説明は500文字以内で入力してください。")]
    public string? Description { get; set; }

    /// <summary>
    /// 代表者名
    /// </summary>
    [MaxLength(100, ErrorMessage = "代表者名は100文字以内で入力してください。")]
    public string? RepresentativeName { get; set; }

    /// <summary>
    /// メールアドレス
    /// </summary>
    [EmailAddress(ErrorMessage = "有効なメールアドレス形式で入力してください。")]
    [MaxLength(100, ErrorMessage = "メールアドレスは100文字以内で入力してください。")]
    public string? Email { get; set; }

    /// <summary>
    /// 管理者ユーザー名
    /// </summary>
    [Required(ErrorMessage = "管理者ユーザー名は必須です。")]
    [MaxLength(50, ErrorMessage = "ユーザー名は50文字以内で入力してください。")]
    public required string AdminUsername { get; set; }

    /// <summary>
    /// 管理者メールアドレス
    /// </summary>
    [Required(ErrorMessage = "管理者メールアドレスは必須です。")]
    [EmailAddress(ErrorMessage = "有効なメールアドレス形式で入力してください。")]
    [MaxLength(100, ErrorMessage = "メールアドレスは100文字以内で入力してください。")]
    public required string AdminEmail { get; set; }
}

/// <summary>
/// 組織更新リクエスト（管理者用）
/// </summary>
public class AdminUpdateOrganizationRequest
{
    /// <summary>
    /// 組織名
    /// </summary>
    [MaxLength(100, ErrorMessage = "組織名は100文字以内で入力してください。")]
    public string? Name { get; set; }

    /// <summary>
    /// 組織の説明
    /// </summary>
    [MaxLength(500, ErrorMessage = "説明は500文字以内で入力してください。")]
    public string? Description { get; set; }

    /// <summary>
    /// 代表者名
    /// </summary>
    [MaxLength(100, ErrorMessage = "代表者名は100文字以内で入力してください。")]
    public string? RepresentativeName { get; set; }

    /// <summary>
    /// 電話番号
    /// </summary>
    [Phone(ErrorMessage = "有効な電話番号形式で入力してください。")]
    [MaxLength(20, ErrorMessage = "電話番号は20文字以内で入力してください。")]
    public string? PhoneNumber { get; set; }

    /// <summary>
    /// メールアドレス
    /// </summary>
    [EmailAddress(ErrorMessage = "有効なメールアドレス形式で入力してください。")]
    [MaxLength(100, ErrorMessage = "メールアドレスは100文字以内で入力してください。")]
    public string? Email { get; set; }

    /// <summary>
    /// 組織の楽観的ロック用のRowVersion
    /// </summary>
    [Required(ErrorMessage = "RowVersionは必須です。")]
    public required uint RowVersion { get; set; }

}

/// <summary>
/// 組織更新リクエスト（バックエンドサービス用）
/// </summary>
public class BackendUpdateOrganizationRequest
{
    /// <summary>
    /// 組織名
    /// </summary>
    [MaxLength(100, ErrorMessage = "組織名は100文字以内で入力してください。")]
    public string? Name { get; set; }

    /// <summary>
    /// 組織コード
    /// </summary>
    [MaxLength(50, ErrorMessage = "組織コードは50文字以内で入力してください。")]
    public string? Code { get; set; }

    /// <summary>
    /// 組織の説明
    /// </summary>
    [MaxLength(500, ErrorMessage = "説明は500文字以内で入力してください。")]
    public string? Description { get; set; }

    /// <summary>
    /// 代表者名
    /// </summary>
    [MaxLength(100, ErrorMessage = "代表者名は100文字以内で入力してください。")]
    public string? RepresentativeName { get; set; }

    /// <summary>
    /// 電話番号
    /// </summary>
    [Phone(ErrorMessage = "有効な電話番号形式で入力してください。")]
    [MaxLength(20, ErrorMessage = "電話番号は20文字以内で入力してください。")]
    public string? PhoneNumber { get; set; }

    /// <summary>
    /// メールアドレス
    /// </summary>
    [EmailAddress(ErrorMessage = "有効なメールアドレス形式で入力してください。")]
    [MaxLength(100, ErrorMessage = "メールアドレスは100文字以内で入力してください。")]
    public string? Email { get; set; }

    /// <summary>
    /// 有効フラグ
    /// </summary>
    public bool? IsActive { get; set; }

    /// <summary>
    /// 組織の楽観的ロック用のRowVersion
    /// </summary>
    [Required(ErrorMessage = "RowVersionは必須です。")]
    public required uint RowVersion { get; set; }
}

/// <summary>
/// 組織削除リクエスト
/// </summary>
public class DeleteOrganizationRequest
{
    /// <summary>
    /// 組織の楽観的ロック用のRowVersion
    /// </summary>
    [Required(ErrorMessage = "RowVersionは必須です。")]
    public required uint RowVersion { get; set; }
}

/// <summary>
/// 組織のアクティブ状態変更リクエスト
/// </summary>
public class SetOrganizationActiveStatusRequest
{
    /// <summary>
    /// 有効フラグ
    /// </summary>
    [Required(ErrorMessage = "IsActiveは必須です。")]
    public required bool IsActive { get; set; }

    /// <summary>
    /// 組織の楽観的ロック用のRowVersion
    /// </summary>
    [Required(ErrorMessage = "RowVersionは必須です。")]
    public required uint RowVersion { get; set; }
}

