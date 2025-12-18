namespace Pecus.Models.Enums;

/// <summary>
/// タスクのステータスフィルター
/// </summary>
public enum TaskStatusFilter
{
    /// <summary>
    /// すべてのタスク
    /// </summary>
    All,

    /// <summary>
    /// 未完了のタスク（完了でも破棄でもない）
    /// </summary>
    Active,

    /// <summary>
    /// 完了したタスク（破棄は除く）
    /// </summary>
    Completed,

    /// <summary>
    /// 破棄されたタスク
    /// </summary>
    Discarded,
}

