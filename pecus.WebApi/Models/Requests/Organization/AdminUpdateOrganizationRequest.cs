using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.Organization;

/// <summary>
/// 組織更新リクエスト（管理者用）
/// </summary>
public class AdminUpdateOrganizationRequest
{
    [MaxLength(100, ErrorMessage = "組織名は100文字以内で入力してください。")]
    public string? Name { get; set; }

    [MaxLength(500, ErrorMessage = "説明は500文字以内で入力してください。")]
    public string? Description { get; set; }

    [MaxLength(100, ErrorMessage = "代表者名は100文字以内で入力してください。")]
    public string? RepresentativeName { get; set; }

    [Phone(ErrorMessage = "有効な電話番号形式で入力してください。")]
    [MaxLength(20, ErrorMessage = "電話番号は20文字以内で入力してください。")]
    public string? PhoneNumber { get; set; }

    [EmailAddress(ErrorMessage = "有効なメールアドレス形式で入力してください。")]
    [MaxLength(100, ErrorMessage = "メールアドレスは100文字以内で入力してください。")]
    public string? Email { get; set; }

    [Required(ErrorMessage = "RowVersionは必須です。")]
    public required uint RowVersion { get; set; }
}
