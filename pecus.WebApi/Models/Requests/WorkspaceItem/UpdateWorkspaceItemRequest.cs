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

    /// <summary>
    /// 下書き中フラグ
    /// </summary>
    public bool? IsDraft { get; set; }

    /// <summary>
    /// 編集不可フラグ（アーカイブ）
    /// </summary>
    public bool? IsArchived { get; set; }

    /// <summary>
    /// コミッターユーザーID（NULL可）
    /// </summary>
    public int? CommitterId { get; set; }

    /// <summary>
    /// アイテム内容
    /// </summary>
    [MaxLength(10000, ErrorMessage = "アイテム内容は10000文字以内で入力してください。")]
    public string? Content { get; set; }

    /// <summary>
    /// アクティブフラグ
    /// </summary>
    public bool? IsActive { get; set; }

    /// <summary>
    /// アイテムの楽観的ロック用のRowVersion
    /// </summary>
    [Required(ErrorMessage = "RowVersionは必須です。")]
    public required byte[] RowVersion { get; set; }
}
