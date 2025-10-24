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
    [StringLength(100, ErrorMessage = "組織名は100文字以内で入力してください。")]
    public required string Name { get; set; }

    /// <summary>
    /// 電話番号
    /// </summary>
    [Required(ErrorMessage = "電話番号は必須です。")]
    [Phone(ErrorMessage = "有効な電話番号形式で入力してください。")]
    [StringLength(20, ErrorMessage = "電話番号は20文字以内で入力してください。")]
    public required string PhoneNumber { get; set; }

    /// <summary>
    /// 組織コード
    /// </summary>
    [StringLength(50, ErrorMessage = "組織コードは50文字以内で入力してください。")]
    public string? Code { get; set; }

    /// <summary>
    /// 組織の説明
    /// </summary>
    [StringLength(500, ErrorMessage = "説明は500文字以内で入力してください。")]
    public string? Description { get; set; }

    /// <summary>
    /// 代表者名
    /// </summary>
    [StringLength(100, ErrorMessage = "代表者名は100文字以内で入力してください。")]
    public string? RepresentativeName { get; set; }

    /// <summary>
    /// メールアドレス
    /// </summary>
    [EmailAddress(ErrorMessage = "有効なメールアドレス形式で入力してください。")]
    [StringLength(100, ErrorMessage = "メールアドレスは100文字以内で入力してください。")]
    public string? Email { get; set; }

    /// <summary>
    /// 管理者ユーザー名
    /// </summary>
    [Required(ErrorMessage = "管理者ユーザー名は必須です。")]
    [StringLength(50, ErrorMessage = "ユーザー名は50文字以内で入力してください。")]
    public required string AdminUsername { get; set; }

    /// <summary>
    /// 管理者メールアドレス
    /// </summary>
    [Required(ErrorMessage = "管理者メールアドレスは必須です。")]
    [EmailAddress(ErrorMessage = "有効なメールアドレス形式で入力してください。")]
    [StringLength(100, ErrorMessage = "メールアドレスは100文字以内で入力してください。")]
    public required string AdminEmail { get; set; }

    /// <summary>
    /// 管理者パスワード
    /// </summary>
    [Required(ErrorMessage = "管理者パスワードは必須です。")]
    [StringLength(
        100,
        MinimumLength = 8,
        ErrorMessage = "パスワードは8文字以上100文字以内で入力してください。"
    )]
    public required string AdminPassword { get; set; }
}

/// <summary>
/// 組織更新リクエスト
/// </summary>
public class UpdateOrganizationRequest
{
    /// <summary>
    /// 組織名
    /// </summary>
    [StringLength(100, ErrorMessage = "組織名は100文字以内で入力してください。")]
    public string? Name { get; set; }

    /// <summary>
    /// 組織コード
    /// </summary>
    [StringLength(50, ErrorMessage = "組織コードは50文字以内で入力してください。")]
    public string? Code { get; set; }

    /// <summary>
    /// 組織の説明
    /// </summary>
    [StringLength(500, ErrorMessage = "説明は500文字以内で入力してください。")]
    public string? Description { get; set; }

    /// <summary>
    /// 代表者名
    /// </summary>
    [StringLength(100, ErrorMessage = "代表者名は100文字以内で入力してください。")]
    public string? RepresentativeName { get; set; }

    /// <summary>
    /// 電話番号
    /// </summary>
    [Phone(ErrorMessage = "有効な電話番号形式で入力してください。")]
    [StringLength(20, ErrorMessage = "電話番号は20文字以内で入力してください。")]
    public string? PhoneNumber { get; set; }

    /// <summary>
    /// メールアドレス
    /// </summary>
    [EmailAddress(ErrorMessage = "有効なメールアドレス形式で入力してください。")]
    [StringLength(100, ErrorMessage = "メールアドレスは100文字以内で入力してください。")]
    public string? Email { get; set; }
}
