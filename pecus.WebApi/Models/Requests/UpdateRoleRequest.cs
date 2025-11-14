using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests;

/// <summary>
/// ロール更新リクエスト
/// </summary>
public class UpdateRoleRequest
{
    [MaxLength(50, ErrorMessage = "ロール名は50文字以内で入力してください。")]
    public string? Name { get; set; }

    [MaxLength(200, ErrorMessage = "説明は200文字以内で入力してください。")]
    public string? Description { get; set; }

    [Required(ErrorMessage = "RowVersionは必須です。")]
    public required uint RowVersion { get; set; }
}
