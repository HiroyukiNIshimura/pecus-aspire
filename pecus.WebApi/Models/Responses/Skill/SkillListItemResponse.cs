using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.Skill;

/// <summary>
/// スキル一覧アイテムレスポンス
/// </summary>
public class SkillListItemResponse
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
    /// スキルの説明
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// 更新日時
    /// </summary>
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// 更新者ユーザーID
    /// </summary>
    public int? UpdatedByUserId { get; set; }

    /// <summary>
    /// スキルのアクティブ/非アクティブ状態
    /// </summary>
    public bool IsActive { get; set; }

    /// <summary>
    /// スキルの利用状況
    /// </summary>
    public List<string> UserIds { get; set; } = new();

    /// <summary>
    /// ユーザー数
    /// </summary>
    public int UserCount { get; set; }
}
