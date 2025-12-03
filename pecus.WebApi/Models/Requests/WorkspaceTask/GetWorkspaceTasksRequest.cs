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
    /// 1ページあたりの件数（1〜100、デフォルト10）
    /// </summary>
    [Range(1, 100, ErrorMessage = "ページサイズは1〜100の範囲で指定してください。")]
    public int PageSize { get; set; } = 10;

    /// <summary>
    /// 完了タスクを含めるか
    /// </summary>
    public bool? IncludeCompleted { get; set; }

    /// <summary>
    /// 破棄タスクを含めるか
    /// </summary>
    public bool? IncludeDiscarded { get; set; }

    /// <summary>
    /// 担当ユーザーIDでフィルタ
    /// </summary>
    public int? AssignedUserId { get; set; }
}
