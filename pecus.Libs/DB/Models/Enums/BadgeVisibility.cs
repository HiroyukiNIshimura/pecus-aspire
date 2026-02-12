namespace Pecus.Libs.DB.Models.Enums;

/// <summary>
/// バッジの公開範囲を表す列挙型
/// </summary>
public enum BadgeVisibility
{
    /// <summary>
    /// 本人のみ閲覧可能（デフォルト）
    /// </summary>
    Private = 1,

    /// <summary>
    /// 同一ワークスペースメンバーに公開
    /// </summary>
    Workspace = 2,

    /// <summary>
    /// 組織内全員に公開
    /// </summary>
    Organization = 3
}