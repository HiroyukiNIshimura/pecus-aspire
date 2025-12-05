using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.WorkspaceTask;

/// <summary>
/// コミッタIDでタスクを検索するリクエスト
/// </summary>
public class GetTasksByCommitterRequest
{
    /// <summary>
    /// ワークスペースID（任意）
    /// </summary>
    public int? WorkspaceId { get; set; }

    /// <summary>
    /// コミッタID（ワークスペースアイテムのコミッタ）
    /// </summary>
    [Required(ErrorMessage = "コミッタIDは必須です。")]
    [Range(1, int.MaxValue, ErrorMessage = "コミッタIDは1以上で指定してください。")]
    public int CommitterId { get; set; }

    /// <summary>
    /// ページ番号（1から始まる）
    /// </summary>
    [Range(1, int.MaxValue, ErrorMessage = "ページ番号は1以上で指定してください。")]
    public int Page { get; set; } = 1;
}
