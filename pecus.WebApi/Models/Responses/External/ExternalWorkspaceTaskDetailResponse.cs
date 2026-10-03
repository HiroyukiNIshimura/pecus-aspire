using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.External;

/// <summary>
/// 外部公開用タスク詳細レスポンス
/// </summary>
public class ExternalWorkspaceTaskDetailResponse
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
    public required ExternalTaskDetailResponse Task { get; set; }
}