using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.WorkspaceItemRelation;

/// <summary>
/// アイテムの親更新リクエスト
/// </summary>
public class UpdateItemParentRequest
{
    /// <summary>
    /// 対象アイテムID（子となるアイテム）
    /// </summary>
    [Required]
    public int ItemId { get; set; }

    /// <summary>
    /// 新しい親アイテムID（ルートにする場合はnull）
    /// </summary>
    public int? NewParentItemId { get; set; }

    /// <summary>
    /// 新しい親の子リスト内での挿入位置インデックス（0始まり）。
    /// null の場合は末尾に追加。
    /// </summary>
    [Range(0, int.MaxValue)]
    public int? InsertAtIndex { get; set; }

    /// <summary>
    /// 楽観的ロック用のRowVersion
    /// </summary>
    [Required]
    public uint RowVersion { get; set; }
}