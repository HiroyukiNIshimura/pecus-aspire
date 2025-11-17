using Pecus.Libs.DB.Models.Enums;

namespace Pecus.Models.Responses.WorkspaceItem;

/// <summary>
/// 関連アイテムの基本情報
/// </summary>
public class RelatedItemInfo
{
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
}
