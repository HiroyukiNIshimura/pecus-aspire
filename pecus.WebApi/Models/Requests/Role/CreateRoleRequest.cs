using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.Role;

/// <summary>
/// ロール作成リクエスト
/// </summary>
public class CreateRoleRequest
{
    [Required(ErrorMessage = "ロール名は必須です。")]
    [MaxLength(50, ErrorMessage = "ロール名は50文字以内で入力してください。")]
    public required string Name { get; set; }

    [MaxLength(200, ErrorMessage = "説明は200文字以内で入力してください。")]
    public string? Description { get; set; }
}