using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.Skill;

/// <summary>
/// スキル利用統計のレスポンス
/// </summary>
public class SkillStatistics
{
    /// <summary>
    /// スキルのトータル件数
    /// </summary>
    [Required]
    public required int TotalSkills { get; set; } = 0;

    /// <summary>
    /// アクティブなスキルの件数
    /// </summary>
    [Required]
    public required int ActiveSkills { get; set; } = 0;

    /// <summary>
    /// 非アクティブなスキルの件数
    /// </summary>
    [Required]
    public required int InactiveSkills { get; set; } = 0;

    /// <summary>
    /// 利用されているスキルのトップ５
    /// </summary>
    [Required]
    public required List<SkillUsageItem> TopUsedSkills { get; set; } = new();

    /// <summary>
    /// 利用されていないスキルのリスト
    /// </summary>
    [Required]
    public required List<SkillUsageItem> UnusedSkills { get; set; } = new();
}

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

