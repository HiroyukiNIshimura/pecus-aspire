using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.WorkspaceItemRelation;

/// <summary>
/// ワークスペースアイテム関連情報レスポンス
/// </summary>
public class WorkspaceItemRelationResponse
{
    /// <summary>
    /// 関連ID
    /// </summary>
    [Required]
    public required int Id { get; set; }

    /// <summary>
    /// 関連元アイテムID
    /// </summary>
    public int FromItemId { get; set; }

    /// <summary>
    /// 関連元アイテムコード
    /// </summary>
    public string FromItemCode { get; set; } = string.Empty;

    /// <summary>
    /// 関連元アイテム件名
    /// </summary>
    public string FromItemSubject { get; set; } = string.Empty;

    /// <summary>
    /// 関連先アイテムID
    /// </summary>
    public int ToItemId { get; set; }

    /// <summary>
    /// 関連先アイテムコード
    /// </summary>
    public string ToItemCode { get; set; } = string.Empty;

    /// <summary>
    /// 関連先アイテム件名
    /// </summary>
    public string ToItemSubject { get; set; } = string.Empty;

    /// <summary>
    /// 関連タイプ
    /// </summary>
    public string? RelationType { get; set; }

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// 作成者ID
    /// </summary>
    public int CreatedByUserId { get; set; }

    /// <summary>
    /// 作成者ユーザー名
    /// </summary>
    public string CreatedByUsername { get; set; } = string.Empty;
}

