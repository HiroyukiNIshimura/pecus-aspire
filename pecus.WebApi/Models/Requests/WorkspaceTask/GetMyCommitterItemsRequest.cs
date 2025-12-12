using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.WorkspaceTask;

/// <summary>
/// マイコミッターアイテム一覧取得リクエスト
/// </summary>
public class GetMyCommitterItemsRequest
{
    /// <summary>
    /// ページ番号（1から始まる）
    /// </summary>
    [Range(1, int.MaxValue, ErrorMessage = "ページ番号は1以上で指定してください。")]
    public int Page { get; set; } = 1;

    /// <summary>
    /// ワークスペースID（任意）
    /// </summary>
    public int? WorkspaceId { get; set; }
}