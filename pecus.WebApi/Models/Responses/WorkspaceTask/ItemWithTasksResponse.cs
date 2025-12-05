namespace Pecus.Models.Responses.WorkspaceTask;

/// <summary>
/// アイテムとそのタスクをグループ化したレスポンス
/// </summary>
public class ItemWithTasksResponse
{
    /// <summary>
    /// ワークスペースアイテム情報
    /// </summary>
    public required TaskItemResponse Item { get; set; }

    /// <summary>
    /// アイテムに紐づくタスクのリスト
    /// </summary>
    public required IEnumerable<WorkspaceTaskDetailResponse> Tasks { get; set; }
}
