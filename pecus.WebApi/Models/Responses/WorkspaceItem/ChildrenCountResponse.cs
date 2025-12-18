namespace Pecus.Models.Responses.WorkspaceItem;

/// <summary>
/// 子アイテム数レスポンス
/// </summary>
public class ChildrenCountResponse
{
    /// <summary>
    /// 対象アイテムID
    /// </summary>
    public int ItemId { get; set; }

    /// <summary>
    /// 直接の子アイテム数
    /// </summary>
    public int ChildrenCount { get; set; }

    /// <summary>
    /// 全子孫アイテム数（孫、ひ孫...を含む）
    /// </summary>
    public int TotalDescendantsCount { get; set; }
}