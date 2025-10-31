namespace Pecus.Libs.DB.Models;

/// <summary>
/// スキル
/// </summary>
public class Skill
{
    /// <summary>
    /// スキルID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// スキル名
    /// </summary>
    public required string Name { get; set; }

    /// <summary>
    /// 説明
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// 組織ID
    /// </summary>
    public int OrganizationId { get; set; }

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// 作成者ユーザーID
    /// </summary>
    public int? CreatedByUserId { get; set; }

    /// <summary>
    /// 更新日時
    /// </summary>
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// 更新者ユーザーID
    /// </summary>
    public int? UpdatedByUserId { get; set; }

    /// <summary>
    /// 所属組織
    /// </summary>
    public Organization Organization { get; set; } = null!;

    /// <summary>
    /// このスキルを持つユーザーとの関連
    /// </summary>
    public ICollection<UserSkill> UserSkills { get; set; } = new List<UserSkill>();

    /// <summary>
    /// 作成者
    /// </summary>
    public User? CreatedByUser { get; set; }

    /// <summary>
    /// 更新者
    /// </summary>
    public User? UpdatedByUser { get; set; }

    /// <summary>
    /// アクティブフラグ
    /// </summary>
    public bool IsActive { get; set; } = true;
}
