using Pecus.Libs.DB.Models.Enums;
using Pecus.Models.Enums;
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

    /// <summary>
    /// アーカイブ済みアイテムを含めるかどうか（デフォルト: false）
    /// true の場合、アーカイブ済みアイテムのみ表示
    /// false または未指定の場合、アーカイブ済みアイテムを除外
    /// </summary>
    public bool? IncludeArchived { get; set; }

    /// <summary>
    /// ワークスペースIDの配列（フィルタリング用）
    /// </summary>
    public int[]? WorkspaceIds { get; set; }

    /// <summary>
    /// ソート項目(省略時はUpdatedAt)
    /// </summary>
    public ItemSortBy? SortBy { get; set; }

    /// <summary>
    /// ソート順序(省略時はAsc)
    /// </summary>
    public SortOrder? Order { get; set; }
}