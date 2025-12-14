using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.Focus;

/// <summary>
/// タスクスコア詳細（デバッグ・説明用）
/// </summary>
public class TaskScoreDetail
{
    /// <summary>
    /// 優先度スコア（1-4）
    /// </summary>
    [Required]
    public required decimal PriorityScore { get; set; }

    /// <summary>
    /// 期限スコア（1-10）
    /// </summary>
    [Required]
    public required decimal DeadlineScore { get; set; }

    /// <summary>
    /// 後続タスク影響スコア（0-10）
    /// </summary>
    [Required]
    public required decimal SuccessorImpactScore { get; set; }

    /// <summary>
    /// 優先度の重み（デフォルト: 2）
    /// </summary>
    [Required]
    public required decimal PriorityWeight { get; set; }

    /// <summary>
    /// 期限の重み（デフォルト: 3）
    /// </summary>
    [Required]
    public required decimal DeadlineWeight { get; set; }

    /// <summary>
    /// 後続影響の重み（デフォルト: 5）
    /// </summary>
    [Required]
    public required decimal SuccessorImpactWeight { get; set; }

    /// <summary>
    /// スコア計算式の説明
    /// </summary>
    public string? Explanation { get; set; }
}
