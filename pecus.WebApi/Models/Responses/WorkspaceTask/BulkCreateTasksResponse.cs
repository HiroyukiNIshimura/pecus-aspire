namespace Pecus.Models.Responses.WorkspaceTask;

/// <summary>
/// 一括タスク作成の応答
/// </summary>
public class BulkCreateTasksResponse
{
    /// <summary>
    /// 作成されたタスクの一覧
    /// </summary>
    public required List<CreatedTaskInfo> CreatedTasks { get; set; }

    /// <summary>
    /// 作成されたタスク数
    /// </summary>
    public int TotalCreated { get; set; }
}

/// <summary>
/// 作成されたタスク情報
/// </summary>
public class CreatedTaskInfo
{
    /// <summary>
    /// リクエスト内でのインデックス（0始まり）
    /// </summary>
    public int RequestIndex { get; set; }

    /// <summary>
    /// 作成されたタスクID
    /// </summary>
    public int TaskId { get; set; }

    /// <summary>
    /// タスクシーケンス番号
    /// </summary>
    public int Sequence { get; set; }

    /// <summary>
    /// タスク内容
    /// </summary>
    public required string Content { get; set; }
}