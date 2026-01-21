using Pecus.Libs.DB.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.TaskComment;

/// <summary>
/// タスクコメント詳細レスポンス
/// </summary>
public class TaskCommentDetailResponse : IConflictModel
{
    /// <summary>
    /// コメントID
    /// </summary>
    [Required]
    public required int Id { get; set; }

    /// <summary>
    /// タスクID
    /// </summary>
    public int WorkspaceTaskId { get; set; }

    /// <summary>
    /// コメントしたユーザー情報
    /// </summary>
    public UserIdentityResponse User { get; set; } = new();

    /// <summary>
    /// コメント内容
    /// </summary>
    public string Content { get; set; } = string.Empty;

    /// <summary>
    /// コメントタイプ（NULL の場合は Normal として扱う）
    /// </summary>
    public TaskCommentType? CommentType { get; set; }

    /// <summary>
    /// 削除済みフラグ
    /// </summary>
    public bool IsDeleted { get; set; }

    /// <summary>
    /// 削除日時
    /// </summary>
    public DateTime? DeletedAt { get; set; }

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTimeOffset CreatedAt { get; set; }

    /// <summary>
    /// 更新日時
    /// </summary>
    public DateTimeOffset UpdatedAt { get; set; }

    /// <summary>
    /// 楽観的ロック用のRowVersion
    /// </summary>
    [Required]
    public required uint RowVersion { get; set; }
}