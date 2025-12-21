namespace Pecus.Libs.DB.Models.Enums;

/// <summary>
/// グループチャットのスコープ設定
/// </summary>
public enum GroupChatScope
{
    /// <summary>
    /// ワークスペース単位（デフォルト）
    /// ワークスペースごとにグループチャットが作成される
    /// </summary>
    Workspace = 0,

    /// <summary>
    /// 組織単位
    /// 組織全体で1つのグループチャットを共有
    /// </summary>
    Organization = 1,
}