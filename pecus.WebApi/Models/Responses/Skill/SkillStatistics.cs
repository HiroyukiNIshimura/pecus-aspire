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
    public int TotalSkills { get; set; }

    /// <summary>
    /// アクティブなスキルの件数
    /// </summary>
    public int ActiveSkills { get; set; }

    /// <summary>
    /// 非アクティブなスキルの件数
    /// </summary>
    public int InactiveSkills { get; set; }

    /// <summary>
    /// 利用されているスキルのトップ５
    /// </summary>
    public List<SkillUsageItem> TopUsedSkills { get; set; } = new();

    /// <summary>
    /// 利用されていないスキルのリスト
    /// </summary>
    public List<SkillUsageItem> UnusedSkills { get; set; } = new();
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
