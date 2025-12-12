namespace Pecus.Libs.DB.Models.Enums;

/// <summary>
/// マイアイテムの関連タイプを表す列挙型
/// </summary>
public enum MyItemRelationType
{
    /// <summary>
    /// すべての関連アイテム（オーナー、担当者、コミッター、PIN済み）
    /// </summary>
    All = 0,

    /// <summary>
    /// 自分がオーナーのアイテム
    /// </summary>
    Owner = 1,

    /// <summary>
    /// 自分が担当者のアイテム
    /// </summary>
    Assignee = 2,

    /// <summary>
    /// 自分がコミッター（最後にコミットした人）のアイテム
    /// </summary>
    Committer = 3,

    /// <summary>
    /// 自分がPINしたアイテム
    /// </summary>
    Pinned = 4,
}