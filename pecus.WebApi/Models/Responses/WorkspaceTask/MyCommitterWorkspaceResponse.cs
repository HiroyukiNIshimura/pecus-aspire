namespace Pecus.Models.Responses.WorkspaceTask;

/// <summary>
/// マイコミッターワークスペースレスポンス
/// ログインユーザーがコミッターになっているアイテムを持つワークスペースの情報
/// </summary>
public class MyCommitterWorkspaceResponse
{
    /// <summary>
    /// ワークスペースID
    /// </summary>
    public required int WorkspaceId { get; set; }

    /// <summary>
    /// ワークスペースコード
    /// </summary>
    public required string WorkspaceCode { get; set; }

    /// <summary>
    /// ワークスペース名
    /// </summary>
    public required string WorkspaceName { get; set; }

    /// <summary>
    /// ジャンルアイコン
    /// </summary>
    public string? GenreIcon { get; set; }

    /// <summary>
    /// ジャンル名
    /// </summary>
    public string? GenreName { get; set; }

    /// <summary>
    /// コミッターになっているアイテム数
    /// </summary>
    public required int ItemCount { get; set; }

    /// <summary>
    /// 未完了タスク数
    /// </summary>
    public required int ActiveTaskCount { get; set; }

    /// <summary>
    /// 完了済みタスク数
    /// </summary>
    public required int CompletedTaskCount { get; set; }

    /// <summary>
    /// 期限超過タスク数
    /// </summary>
    public required int OverdueTaskCount { get; set; }

    /// <summary>
    /// ヘルプコメント数
    /// </summary>
    public required int HelpCommentCount { get; set; }

    /// <summary>
    /// 督促コメント数
    /// </summary>
    public required int ReminderCommentCount { get; set; }

    /// <summary>
    /// 最も古い期限日（ソート用、未完了タスクのみ対象）
    /// </summary>
    public DateTimeOffset? OldestDueDate { get; set; }
}