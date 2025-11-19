using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.WorkspaceItem;

/// <summary>
/// ワークスペースアイテム作業者更新リクエスト
/// </summary>
public class UpdateWorkspaceItemAssigneeRequest
{
    /// <summary>
    /// 作業者ユーザーID（NULL で割り当て解除）
    /// </summary>
    public int? AssigneeId { get; set; }

    /// <summary>
    /// 楽観的ロック用バージョン
    /// </summary>
    [Required(ErrorMessage = "RowVersionは必須です。")]
    public required uint RowVersion { get; set; }
}
