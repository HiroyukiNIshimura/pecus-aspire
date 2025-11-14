using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.Skill;

/// <summary>
/// スキルレスポンス
/// </summary>
public class SkillResponse
{
    /// <summary>
    /// 成功フラグ
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// メッセージ
    /// </summary>
    [Required]
    public required string Message { get; set; }

    /// <summary>
    /// スキル詳細
    /// </summary>
    public SkillDetailResponse? Skill { get; set; }
}

