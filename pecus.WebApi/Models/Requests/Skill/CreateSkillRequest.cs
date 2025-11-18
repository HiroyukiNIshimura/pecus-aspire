using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.Skill;

/// <summary>
/// スキル作成リクエスト
/// </summary>
public class CreateSkillRequest
{
    [Required(ErrorMessage = "スキル名は必須です。")]
    [MaxLength(100, ErrorMessage = "スキル名は100文字以内で入力してください。")]
    public required string Name { get; set; }

    [MaxLength(500, ErrorMessage = "説明は500文字以内で入力してください。")]
    public string? Description { get; set; }
}