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
    public string? Body { get; set; }

    /// <summary>
    /// 作業中のユーザーID（NULL可）
    /// </summary>
    public int? AssigneeId { get; set; }

    /// <summary>
    /// 重要度（指定しない場合は NULL として保存される）
    /// </summary>
    public TaskPriority? Priority { get; set; }

    /// <summary>
    /// 期限日時(ISO 8601 形式)
    /// </summary>
    public DateTimeOffset? DueDate { get; set; }

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

    /// <summary>
    /// 一時添付ファイルのセッションID（エディタでアップロードした画像を正式化するため）
    /// </summary>
    [MaxLength(50, ErrorMessage = "セッションIDは50文字以内で入力してください。")]
    public string? TempSessionId { get; set; }

    /// <summary>
    /// 一時添付ファイルIDのリスト（コンテンツ内で参照されている一時ファイル）
    /// </summary>
    public List<string>? TempAttachmentIds { get; set; }
}