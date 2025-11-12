using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.WorkspaceItemRelation;

/// <summary>
/// ワークスペースアイテム関連追加リクエスト
/// </summary>
public class AddWorkspaceItemRelationRequest
{
    /// <summary>
    /// 関連先アイテムID
    /// </summary>
    [Required(ErrorMessage = "関連先アイテムIDは必須です。")]
    public int ToItemId { get; set; }

    /// <summary>
    /// 関連タイプ（オプション）
    /// 指定可能な値: "related", "blocks", "blocked_by", "depends_on", "duplicates", "subtask_of", "parent_of", "relates_to"
    /// </summary>
    [MaxLength(50, ErrorMessage = "関連タイプは50文字以内で入力してください。")]
    public string? RelationType { get; set; }
}

