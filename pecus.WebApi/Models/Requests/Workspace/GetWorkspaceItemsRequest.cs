using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.Workspace;

/// <summary>
/// ワークスペースアイテム一覧取得リクエスト
/// </summary>
public class GetWorkspaceItemsRequest
{
    /// <summary>
    /// ページ番号（1から始まる）
    /// </summary>
    [Range(1, int.MaxValue, ErrorMessage = "ページは1以上で指定してください。")]
    public int Page { get; set; } = 1;
}
