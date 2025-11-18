using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.Skill;

/// <summary>
/// スキル更新リクエスト
/// </summary>
public class UpdateSkillRequest
{
    [MaxLength(100, ErrorMessage = "スキル名は100文字以内で入力してください。")]
    public string? Name { get; set; }

    [MaxLength(500, ErrorMessage = "説明は500文字以内で入力してください。")]
    public string? Description { get; set; }

    public bool? IsActive { get; set; }

    [Required(ErrorMessage = "RowVersionは必須です。")]
    public required uint RowVersion { get; set; }
}