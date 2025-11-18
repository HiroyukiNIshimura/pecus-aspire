using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.Organization;

/// <summary>
/// 組織登録リクエスト
/// </summary>
public class CreateOrganizationRequest
{
    [Required(ErrorMessage = "組織名は必須です。")]
    [MaxLength(100, ErrorMessage = "組織名は100文字以内で入力してください。")]
    public required string Name { get; set; }

    [Required(ErrorMessage = "電話番号は必須です。")]
    [Phone(ErrorMessage = "有効な電話番号形式で入力してください。")]
    [MaxLength(20, ErrorMessage = "電話番号は20文字以内で入力してください。")]
    public required string PhoneNumber { get; set; }

    [MaxLength(50, ErrorMessage = "組織コードは50文字以内で入力してください。")]
    public string? Code { get; set; }

    [MaxLength(500, ErrorMessage = "説明は500文字以内で入力してください。")]
    public string? Description { get; set; }

    [MaxLength(100, ErrorMessage = "代表者名は100文字以内で入力してください。")]
    public string? RepresentativeName { get; set; }

    [EmailAddress(ErrorMessage = "有効なメールアドレス形式で入力してください。")]
    [MaxLength(100, ErrorMessage = "メールアドレスは100文字以内で入力してください。")]
    public string? Email { get; set; }

    [Required(ErrorMessage = "管理者ユーザー名は必須です。")]
    [MaxLength(50, ErrorMessage = "ユーザー名は50文字以内で入力してください。")]
    public required string AdminUsername { get; set; }

    [Required(ErrorMessage = "管理者メールアドレスは必須です。")]
    [EmailAddress(ErrorMessage = "有効なメールアドレス形式で入力してください。")]
    [MaxLength(100, ErrorMessage = "メールアドレスは100文字以内で入力してください。")]
    public required string AdminEmail { get; set; }
}