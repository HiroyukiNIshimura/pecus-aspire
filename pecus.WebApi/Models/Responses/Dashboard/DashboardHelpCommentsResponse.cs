using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.Dashboard;

/// <summary>
/// ダッシュボード ヘルプコメント一覧レスポンス
/// </summary>
public class DashboardHelpCommentsResponse
{
    /// <summary>
    /// ヘルプコメント一覧
    /// </summary>
    [Required]
    public required List<HelpCommentItem> Comments { get; set; }

    /// <summary>
    /// 総件数
    /// </summary>
    [Required]
    public required int TotalCount { get; set; }
}

/// <summary>
/// ヘルプコメント項目
/// </summary>
public class HelpCommentItem
{
    /// <summary>
    /// コメントID
    /// </summary>
    [Required]
    public required int CommentId { get; set; }

    /// <summary>
    /// コメント内容
    /// </summary>
    [Required]
    public required string Content { get; set; }

    /// <summary>
    /// コメント投稿日時
    /// </summary>
    [Required]
    public required DateTimeOffset CreatedAt { get; set; }

    /// <summary>
    /// コメント投稿者ID
    /// </summary>
    [Required]
    public required int CommentUserId { get; set; }

    /// <summary>
    /// コメント投稿者名
    /// </summary>
    [Required]
    public required string CommentUsername { get; set; }

    /// <summary>
    /// コメント投稿者アバターURL
    /// </summary>
    public string? CommentUserAvatarUrl { get; set; }

    /// <summary>
    /// タスクID
    /// </summary>
    [Required]
    public required int TaskId { get; set; }

    /// <summary>
    /// タスク内容
    /// </summary>
    [Required]
    public required string TaskContent { get; set; }

    /// <summary>
    /// タスク担当者ID
    /// </summary>
    public int? TaskAssigneeId { get; set; }

    /// <summary>
    /// タスク担当者名
    /// </summary>
    public string? TaskAssigneeName { get; set; }

    /// <summary>
    /// ワークスペースID
    /// </summary>
    [Required]
    public required int WorkspaceId { get; set; }

    /// <summary>
    /// ワークスペースコード
    /// </summary>
    [Required]
    public required string WorkspaceCode { get; set; }

    /// <summary>
    /// ワークスペース名
    /// </summary>
    [Required]
    public required string WorkspaceName { get; set; }

    /// <summary>
    /// アイテムID
    /// </summary>
    [Required]
    public required int ItemId { get; set; }

    /// <summary>
    /// アイテムコード（PROJ-42形式）
    /// </summary>
    [Required]
    public required string ItemCode { get; set; }

    /// <summary>
    /// アイテム件名
    /// </summary>
    public string? ItemSubject { get; set; }
}