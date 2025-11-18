using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.Skill;

/// <summary>
/// スキル利用アイテム（ID と名前）
/// </summary>
public class SkillUsageItem
{
    /// <summary>
    /// スキルID
    /// </summary>
    [Required]
    public required int Id { get; set; }

    /// <summary>
    /// スキル名
    /// </summary>
    [Required]
    public required string Name { get; set; }
}