namespace Pecus.Libs.DB.Models.Enums;

/// <summary>
/// タスクの種類を表す列挙型
/// </summary>
public enum TaskType
{
    /// <summary>
    /// バグ修正
    /// </summary>
    Bug = 1,

    /// <summary>
    /// 新機能開発
    /// </summary>
    Feature = 2,

    /// <summary>
    /// ドキュメント作成・更新
    /// </summary>
    Documentation = 3,

    /// <summary>
    /// レビュー
    /// </summary>
    Review = 4,

    /// <summary>
    /// テスト
    /// </summary>
    Testing = 5,

    /// <summary>
    /// リファクタリング
    /// </summary>
    Refactoring = 6,

    /// <summary>
    /// 調査・研究
    /// </summary>
    Research = 7,

    /// <summary>
    /// その他
    /// </summary>
    Other = 99,
}
