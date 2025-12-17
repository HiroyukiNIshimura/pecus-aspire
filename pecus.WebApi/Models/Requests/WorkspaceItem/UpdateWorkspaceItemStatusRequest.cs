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
    /// アーカイブ時に子アイテムも一緒にアーカイブするかどうか（ドキュメントモード用）
    /// true: 子アイテムもアーカイブする
    /// false: 子アイテムはルートに移動してからアーカイブする
    /// null: 子アイテムはそのまま（従来の動作）
    /// </summary>
    public bool? ArchiveChildren { get; set; }

    /// <summary>
    /// アイテムの楽観的ロック用のRowVersion
    /// </summary>
    [Required(ErrorMessage = "RowVersionは必須です。")]
    public required uint RowVersion { get; set; }

}