namespace Pecus.Models.Responses.WorkspaceTask;

/// <summary>
/// 期限日でグループ化されたタスク一覧レスポンス
/// </summary>
public class TasksByDueDateResponse
{
    /// <summary>
    /// 期限日（日付のみ）
    /// </summary>
    public required DateOnly DueDate { get; set; }

    /// <summary>
    /// その期限日のタスク一覧（アイテムID + タスクID順）
    /// </summary>
    public required List<TaskWithItemResponse> Tasks { get; set; }
}