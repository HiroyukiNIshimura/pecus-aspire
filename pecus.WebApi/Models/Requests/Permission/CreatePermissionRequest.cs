using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.Permission;

/// <summary>
/// 権限作成リクエスト
/// </summary>
public class CreatePermissionRequest
{
    [Required(ErrorMessage = "権限名は必須です。")]
    [MaxLength(100, ErrorMessage = "権限名は100文字以内で入力してください。")]
    public required string Name { get; set; }

    [MaxLength(200, ErrorMessage = "説明は200文字以内で入力してください。")]
    public string? Description { get; set; }

    [MaxLength(50, ErrorMessage = "カテゴリは50文字以内で入力してください。")]
    public string? Category { get; set; }
}