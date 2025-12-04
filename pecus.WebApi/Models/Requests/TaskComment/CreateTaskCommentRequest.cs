using Pecus.Libs.DB.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.TaskComment;

/// <summary>
/// タスクコメント作成リクエスト
/// </summary>
public class CreateTaskCommentRequest
{
    /// <summary>
    /// コメント内容
    /// </summary>
    [Required(ErrorMessage = "コメント内容は必須です。")]
    [MaxLength(500, ErrorMessage = "コメント内容は500文字以内で入力してください。")]
    public required string Content { get; set; }

    /// <summary>
    /// コメントタイプ（NULL の場合は Normal として扱う）
    /// </summary>
    public TaskCommentType? CommentType { get; set; }
}
