using Pecus.Libs.DB.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.TaskComment;

/// <summary>
/// タスクコメント更新リクエスト
/// </summary>
public class UpdateTaskCommentRequest
{
    /// <summary>
    /// コメント内容
    /// </summary>
    [MaxLength(500, ErrorMessage = "コメント内容は500文字以内で入力してください。")]
    public string? Content { get; set; }

    /// <summary>
    /// コメントタイプ
    /// </summary>
    public TaskCommentType? CommentType { get; set; }

    /// <summary>
    /// 楽観的ロック用のRowVersion（必須）
    /// </summary>
    [Required(ErrorMessage = "RowVersionは必須です。")]
    public required uint RowVersion { get; set; }
}