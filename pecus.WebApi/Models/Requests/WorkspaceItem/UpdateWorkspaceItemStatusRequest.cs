using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.WorkspaceItem;

/// <summary>
/// ワークスペースアイテムステータス更新リクエスト
/// </summary>
public class UpdateWorkspaceItemStatusRequest
{
    /// <summary>
    /// 下書き中フラグ
    /// </summary>
    public bool? IsDraft { get; set; }

    /// <summary>
    /// アーカイブフラグ
    /// </summary>
    public bool? IsArchived { get; set; }

    /// <summary>
    /// アーカイブ時に子アイテムとの親子関係を維持するかどうか（ドキュメントモード用）
    /// true: 親子関係を維持する（子はツリーから除外されるが、親のアーカイブ解除で復活）
    /// false: 子アイテムはルートに移動（親子関係を解除）
    /// null: 子アイテムはそのまま（従来の動作）
    /// </summary>
    public bool? KeepChildrenRelation { get; set; }

    /// <summary>
    /// アイテムの楽観的ロック用のRowVersion
    /// </summary>
    [Required(ErrorMessage = "RowVersionは必須です。")]
    public required uint RowVersion { get; set; }

}