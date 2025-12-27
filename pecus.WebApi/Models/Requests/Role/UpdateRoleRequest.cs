using Pecus.Libs.DB.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.Role;

/// <summary>
/// ロール更新リクエスト
/// </summary>
public class UpdateRoleRequest
{
    public SystemRole? Name { get; set; }

    [MaxLength(200, ErrorMessage = "説明は200文字以内で入力してください。")]
    public string? Description { get; set; }

    [Required(ErrorMessage = "RowVersionは必須です。")]
    public required uint RowVersion { get; set; }
}