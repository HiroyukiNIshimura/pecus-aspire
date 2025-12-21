namespace Pecus.Models.Enums;

/// <summary>
/// アイテムのソート項目
/// </summary>
public enum ItemSortBy
{
    /// <summary>
    /// 作成日時順
    /// </summary>
    CreatedAt,

    /// <summary>
    /// 更新日時順
    /// </summary>
    UpdatedAt,

    /// <summary>
    /// 優先度順
    /// </summary>
    Priority,

    /// <summary>
    /// 期限日時順
    /// </summary>
    DueDate,
}