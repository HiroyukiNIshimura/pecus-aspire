using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.BackOffice;

/// <summary>
/// BackOffice用 組織更新リクエスト
/// </summary>
public class BackOfficeUpdateOrganizationRequest
{
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
    [MaxLength(254, ErrorMessage = "メールアドレスは254文字以内で入力してください。")]
    public string? Email { get; set; }

    /// <summary>
    /// アクティブフラグ
    /// </summary>
    public bool? IsActive { get; set; }

    /// <summary>
    /// 楽観的ロック用バージョン番号
    /// </summary>
    [Required(ErrorMessage = "RowVersionは必須です。")]
    public required uint RowVersion { get; set; }
}
