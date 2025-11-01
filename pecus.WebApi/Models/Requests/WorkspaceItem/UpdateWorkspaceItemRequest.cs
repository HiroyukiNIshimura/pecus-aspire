using Pecus.Libs.DB.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.WorkspaceItem;

/// <summary>
/// ワークスペースアイテム更新リクエスト
/// </summary>
public class UpdateWorkspaceItemRequest
{
    /// <summary>
    /// 件名
    /// </summary>
    [MaxLength(200, ErrorMessage = "件名は200文字以内で入力してください。")]
    public string? Subject { get; set; }

    /// <summary>
    /// 本文（WYSIWYGのノードデータをJSON形式で保存）
    /// </summary>
    [MaxLength(5000000, ErrorMessage = "本文のデータが許容範囲を超えています。")]
    public string? Body { get; set; }

    /// <summary>
    /// 作業中のユーザーID（NULL可）
    /// </summary>
    public int? AssigneeId { get; set; }

    /// <summary>
    /// 重要度
    /// </summary>
    public TaskPriority? Priority { get; set; }

    /// <summary>
    /// 期限日
    /// </summary>
    public DateTime? DueDate { get; set; }
}
