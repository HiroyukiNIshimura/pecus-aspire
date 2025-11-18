namespace Pecus.Libs.DB.Models.Enums;

/// <summary>
/// ワークスペースアイテム間の関連タイプを表す列挙型
/// </summary>
public enum RelationType
{
    /// <summary>
    /// 一般的な関連（双方向）
    /// </summary>
    Related = 1,

    /// <summary>
    /// これがあれを阻止している（A → B）
    /// </summary>
    Blocks = 2,

    /// <summary>
    /// これがあれに阻止されている（A ← B）
    /// </summary>
    BlockedBy = 3,

    /// <summary>
    /// これがあれに依存している（A → B）
    /// </summary>
    DependsOn = 4,

    /// <summary>
    /// これがあれの重複（双方向）
    /// </summary>
    Duplicates = 5,

    /// <summary>
    /// これがあれのサブタスク（A → B）
    /// </summary>
    SubtaskOf = 6,

    /// <summary>
    /// これがあれの親タスク（A → B）
    /// </summary>
    ParentOf = 7,

    /// <summary>
    /// これがあれに関連している（双方向）
    /// </summary>
    RelatesTo = 8,
}