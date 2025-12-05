using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.WorkspaceTask;

/// <summary>
/// ログインユーザーに割り当てられたタスク一覧取得リクエスト
/// </summary>
public class GetMyTasksRequest
{
    /// <summary>
    /// ページ番号（1から開始）
    /// </summary>
    [Range(1, int.MaxValue, ErrorMessage = "ページ番号は1以上で指定してください。")]
    public int Page { get; set; } = 1;

    /// <summary>
    /// ステータスフィルター（省略時はすべて表示）
    /// </summary>
    public TaskStatusFilter? Status { get; set; }
}
