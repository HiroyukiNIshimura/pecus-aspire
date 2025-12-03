using Pecus.Libs.DB.Models.Enums;

namespace Pecus.Models.Responses.WorkspaceItem;

/// <summary>
/// 関連アイテムの基本情報
/// </summary>
public class RelatedItemInfo
{
    /// <summary>
    /// 関連ID（削除時に使用）
    /// </summary>
    public int RelationId { get; set; }

    /// <summary>
    /// アイテムID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 件名
    /// </summary>
    public string Subject { get; set; } = string.Empty;

    /// <summary>
    /// コード
    /// </summary>
    public string Code { get; set; } = string.Empty;

    /// <summary>
    /// 関連タイプ
    /// </summary>
    public RelationType? RelationType { get; set; }

    /// <summary>
    /// 関連の方向（このアイテムから見て）
    /// "from": このアイテムが関連元
    /// "to": このアイテムが関連先
    /// </summary>
    public string Direction { get; set; } = string.Empty;

    /// <summary>
    /// オーナーID
    /// </summary>
    public int? OwnerId { get; set; }

    /// <summary>
    /// アーカイブ済みかどうか
    /// </summary>
    public bool IsArchived { get; set; }

    /// <summary>
    /// オーナーユーザー名
    /// </summary>
    public string? OwnerUsername { get; set; }

    /// <summary>
    /// オーナーアバターURL
    /// </summary>
    public string? OwnerAvatarUrl { get; set; }
}