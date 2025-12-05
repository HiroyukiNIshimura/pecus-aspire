using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.WorkspaceTask;

public class WorkspaceTaskStatistics
{
    /// <summary>
    /// コメント数
    /// </summary>
    [Required]
    public required int CommentCount { get; set; }

    /// <summary>
    /// 総件数
    /// </summary>
    [Required]
    public required int TotalCount { get; set; }

    /// <summary>
    /// 完了済み件数
    /// </summary>
    [Required]
    public required int CompletedCount { get; set; }

    /// <summary>
    /// 未完了件数
    /// </summary>
    [Required]
    public required int IncompleteCount { get; set; }

    /// <summary>
    /// 期限切れ件数
    /// </summary>
    [Required]
    public required int OverdueCount { get; set; }

    /// <summary>
    /// 今日締め切り件数
    /// </summary>
    [Required]
    public required int DueTodayCount { get; set; }

    /// <summary>
    /// 近日締め切り件数（7日以内）
    /// </summary>
    [Required]
    public required int DueSoonCount { get; set; }

    /// <summary>
    /// 破棄された件数
    /// </summary>
    [Required]
    public required int DiscardedCount { get; set; }
}