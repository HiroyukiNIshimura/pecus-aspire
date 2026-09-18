using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.External;

/// <summary>
/// 外部公開用タスクコメント一覧レスポンス
/// </summary>
public class ExternalTaskCommentListResponse
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
    /// タスク情報
    /// </summary>
    [Required]
    public required ExternalTaskRefResponse Task { get; set; }

    /// <summary>
    /// コメント一覧
    /// </summary>
    [Required]
    public required IReadOnlyList<ExternalTaskCommentResponse> Comments { get; set; }
}