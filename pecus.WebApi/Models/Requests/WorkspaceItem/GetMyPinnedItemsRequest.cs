using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.WorkspaceItem;

/// <summary>
/// PIN済みワークスペースアイテム一覧取得リクエスト
/// </summary>
public class GetMyPinnedItemsRequest
{
    /// <summary>
    /// ページ番号（1から開始）
    /// </summary>
    [Range(1, int.MaxValue, ErrorMessage = "ページ番号は1以上で指定してください。")]
    public int Page { get; set; } = 1;
}
