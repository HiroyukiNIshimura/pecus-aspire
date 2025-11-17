using Pecus.Libs.DB.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.WorkspaceItem;

/// <summary>
/// ワークスペースアイテム作成リクエスト
/// </summary>
public class CreateWorkspaceItemRequest
{
    /// <summary>
    /// 件名
    /// </summary>
    [Required(ErrorMessage = "件名は必須です。")]
    [MaxLength(200, ErrorMessage = "件名は200文字以内で入力してください。")]
    public string Subject { get; set; } = string.Empty;

    /// <summary>
    /// 本文（WYSIWYGのノードデータをJSON形式で保存）
    /// </summary>
    [MaxLength(5000000, ErrorMessage = "本文のデータが許容範囲を超えています。")]
    public string Body { get; set; } = string.Empty;

    /// <summary>
    /// 作業中のユーザーID（NULL可）
    /// </summary>
    public int? AssigneeId { get; set; }

    /// <summary>
    /// 重要度（指定しない場合は NULL として保存される）
    /// </summary>
    public TaskPriority? Priority { get; set; }

    /// <summary>
    /// 期限日（NULL許容）
    /// </summary>
    public DateTime? DueDate { get; set; }

    /// <summary>
    /// 下書き中フラグ
    /// </summary>
    public bool IsDraft { get; set; } = true;

    /// <summary>
    /// コミッターユーザーID（NULL可）
    /// </summary>
    public int? CommitterId { get; set; }

    /// <summary>
    /// タグ名のリスト（存在しないタグは自動作成）
    /// </summary>
    [Validation.StringListItems(50)]
    public List<string>? TagNames { get; set; }
}

