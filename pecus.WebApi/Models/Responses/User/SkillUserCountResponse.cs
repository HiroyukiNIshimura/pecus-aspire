using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.User;

/// <summary>
/// スキルごとのユーザー数
/// </summary>
public class SkillUserCountResponse
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

    /// <summary>
    /// ユーザー数
    /// </summary>
    [Required]
    public required int Count { get; set; } = 0;
}
