using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.Permission;

/// <summary>
/// 権限更新リクエスト
/// </summary>
public class UpdatePermissionRequest
{
    [MaxLength(100, ErrorMessage = "権限名は100文字以内で入力してください。")]
    public string? Name { get; set; }

    [MaxLength(200, ErrorMessage = "説明は200文字以内で入力してください。")]
    public string? Description { get; set; }

    [MaxLength(50, ErrorMessage = "カテゴリは50文字以内で入力してください。")]
    public string? Category { get; set; }

    [Required(ErrorMessage = "RowVersionは必須です。")]
    public required uint RowVersion { get; set; }
}