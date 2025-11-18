using Pecus.Libs.DB.Models.Enums;
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
    /// 関連タイプ（NULL の場合は Related として扱う）
    /// </summary>
    public RelationType? RelationType { get; set; }
}