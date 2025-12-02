using Pecus.Libs.DB.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.WorkspaceItem;

/// <summary>
/// マイアイテム一覧取得リクエスト
/// </summary>
public class GetMyItemsRequest
{
    /// <summary>
    /// ページ番号（1から開始）
    /// </summary>
    [Range(1, int.MaxValue, ErrorMessage = "ページ番号は1以上で指定してください。")]
    public int Page { get; set; } = 1;

    /// <summary>
    /// 関連タイプ（All, Owner, Assignee, Committer, Pinned）
    /// </summary>
    public MyItemRelationType? Relation { get; set; }
}
