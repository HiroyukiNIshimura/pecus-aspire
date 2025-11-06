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
    /// アイテムの楽観的ロック用のRowVersion
    /// </summary>
    [Required(ErrorMessage = "RowVersionは必須です。")]
    public required byte[] RowVersion { get; set; }

}
