using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.WorkspaceItemRelation;

/// <summary>
/// ドキュメントツリー内の兄弟間ソート順変更リクエスト
/// </summary>
public class UpdateSiblingOrderRequest
{
    /// <summary>
    /// 移動するアイテムID
    /// </summary>
    [Required]
    public int ItemId { get; set; }

    /// <summary>
    /// 挿入位置インデックス（0始まり、同じ親を持つ兄弟リスト内での位置）
    /// </summary>
    [Required]
    [Range(0, int.MaxValue)]
    public int NewIndex { get; set; }

    /// <summary>
    /// 楽観的ロック用のRowVersion
    /// </summary>
    [Required]
    public uint RowVersion { get; set; }
}