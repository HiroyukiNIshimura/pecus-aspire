using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.WorkspaceTask;

/// <summary>
/// タスクのステータスフィルター
/// </summary>
public enum TaskStatusFilter
{
    /// <summary>
    /// すべてのタスク
    /// </summary>
    All,

    /// <summary>
    /// 未完了のタスク（完了でも破棄でもない）
    /// </summary>
    Active,

    /// <summary>
    /// 完了したタスク（破棄は除く）
    /// </summary>
    Completed,

    /// <summary>
    /// 破棄されたタスク
    /// </summary>
    Discarded,
}

/// <summary>
/// タスクのソート項目
/// </summary>
public enum TaskSortBy
{
    /// <summary>
    /// シーケンス番号順
    /// </summary>
    Sequence,

    /// <summary>
    /// 優先度順
    /// </summary>
    Priority,

    /// <summary>
    /// 期限日時順
    /// </summary>
    DueDate,
}

/// <summary>
/// ソート順序
/// </summary>
public enum SortOrder
{
    /// <summary>
    /// 昇順
    /// </summary>
    Asc,

    /// <summary>
    /// 降順
    /// </summary>
    Desc,
}

/// <summary>
/// ワークスペースタスク一覧取得リクエスト
/// </summary>
public class GetWorkspaceTasksRequest
{
    /// <summary>
    /// ページ番号（1から始まる）
    /// </summary>
    [Range(1, int.MaxValue, ErrorMessage = "ページ番号は1以上で指定してください。")]
    public int Page { get; set; } = 1;

    /// <summary>
    /// 1ページあたりの件数（1〜50、デフォルト10）
    /// カルーセルのためクライアントからの指定を許可
    /// </summary>
    [Range(1, 50, ErrorMessage = "ページサイズは1〜50の範囲で指定してください。")]
    public int PageSize { get; set; } = 10;

    /// <summary>
    /// タスクのステータスフィルター（省略時はすべて表示）
    /// </summary>
    public TaskStatusFilter? Status { get; set; }

    /// <summary>
    /// 担当ユーザーIDでフィルタ
    /// </summary>
    public int? AssignedUserId { get; set; }

    /// <summary>
    /// ソート項目(省略時はSequence)
    /// </summary>
    public TaskSortBy? SortBy { get; set; }

    /// <summary>
    /// ソート順序(省略時はAsc)
    /// </summary>
    public SortOrder? Order { get; set; }
}