using Pecus.Libs.DB.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.Role;

/// <summary>
/// ロール作成リクエスト
/// </summary>
public class CreateRoleRequest
{
    [Required(ErrorMessage = "ロール名は必須です。")]
    public required SystemRole Name { get; set; }

    [MaxLength(200, ErrorMessage = "説明は200文字以内で入力してください。")]
    public string? Description { get; set; }
}