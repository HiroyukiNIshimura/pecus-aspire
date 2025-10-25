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
    public string Body { get; set; } = string.Empty;

    /// <summary>
    /// 作業中のユーザーID（NULL可）
    /// </summary>
    public int? AssigneeId { get; set; }

    /// <summary>
    /// 重要度（1: 低、2: 普通、3: 高）
    /// </summary>
    [Range(1, 3, ErrorMessage = "重要度は1〜3の範囲で指定してください。")]
    public int Priority { get; set; } = 2;

    /// <summary>
    /// 期限日
    /// </summary>
    [Required(ErrorMessage = "期限日は必須です。")]
    public DateTime DueDate { get; set; }

    /// <summary>
    /// 下書き中フラグ
    /// </summary>
    public bool IsDraft { get; set; } = true;
}
