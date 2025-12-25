using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.TaskComment;

/// <summary>
/// タスクコメント更新リクエスト
/// コメントタイプは変更不可（内容のみ編集可能）
/// </summary>
public class UpdateTaskCommentRequest
{
    /// <summary>
    /// コメント内容
    /// </summary>
    [MaxLength(500, ErrorMessage = "コメント内容は500文字以内で入力してください。")]
    public string? Content { get; set; }

    /// <summary>
    /// 楽観的ロック用のRowVersion（必須）
    /// </summary>
    [Required(ErrorMessage = "RowVersionは必須です。")]
    public required uint RowVersion { get; set; }
}