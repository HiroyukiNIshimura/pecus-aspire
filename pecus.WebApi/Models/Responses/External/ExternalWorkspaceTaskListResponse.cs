using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.External;

/// <summary>
/// 外部公開用タスク一覧レスポンス
/// </summary>
public class ExternalWorkspaceTaskListResponse
{
    /// <summary>
    /// ワークスペース情報
    /// </summary>
    [Required]
    public required ExternalWorkspaceRefResponse Workspace { get; set; }

    /// <summary>
    /// アイテム情報
    /// </summary>
    [Required]
    public required ExternalItemRefResponse Item { get; set; }

    /// <summary>
    /// タスク一覧
    /// </summary>
    [Required]
    public required IReadOnlyList<ExternalTaskSummaryResponse> Tasks { get; set; }
}