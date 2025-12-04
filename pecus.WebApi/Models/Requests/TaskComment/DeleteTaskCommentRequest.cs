using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.TaskComment;

/// <summary>
/// タスクコメント削除（無効化）リクエスト
/// </summary>
public class DeleteTaskCommentRequest
{
    /// <summary>
    /// 楽観的ロック用のRowVersion（必須）
    /// </summary>
    [Required(ErrorMessage = "RowVersionは必須です。")]
    public required uint RowVersion { get; set; }
}
