namespace Pecus.Models.Enums;

/// <summary>
/// タスクのソート項目
/// </summary>
public enum TaskSortBy
{
    /// <summary>
    /// シーケンス番号順
    /// </summary>
    Sequence,

    /// <summary>
    /// 優先度順
    /// </summary>
    Priority,

    /// <summary>
    /// 期限日時順
    /// </summary>
    DueDate,
}
