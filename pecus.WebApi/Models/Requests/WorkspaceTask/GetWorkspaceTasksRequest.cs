using Pecus.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.WorkspaceTask;


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