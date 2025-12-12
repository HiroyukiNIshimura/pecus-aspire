namespace Pecus.Libs.DB.Models.Enums;

/// <summary>
/// ワークスペースアイテムの更新可能な属性
/// </summary>
public enum WorkspaceItemAttribute
{
    /// <summary>
    /// 担当者
    /// </summary>
    Assignee,

    /// <summary>
    /// コミッター
    /// </summary>
    Committer,

    /// <summary>
    /// 優先度
    /// </summary>
    Priority,

    /// <summary>
    /// 期限日
    /// </summary>
    Duedate,

    /// <summary>
    /// アーカイブ
    /// </summary>
    Archive,
}