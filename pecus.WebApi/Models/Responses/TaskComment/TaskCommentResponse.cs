namespace Pecus.Models.Responses.TaskComment;

/// <summary>
/// タスクコメント操作レスポンス
/// </summary>
public class TaskCommentResponse
{
    /// <summary>
    /// 成功フラグ
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// メッセージ
    /// </summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// タスクコメント詳細
    /// </summary>
    public TaskCommentDetailResponse? TaskComment { get; set; }
}
