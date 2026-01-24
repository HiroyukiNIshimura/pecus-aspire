namespace Pecus.Libs.DB.Models;

/// <summary>
/// ワークスペースアイテムの検索インデックス用テーブル
/// Body から抽出したプレーンテキストを格納し、pgroonga による全文検索に使用
/// </summary>
/// <remarks>
/// このテーブルは派生データのみを格納し、WorkspaceItems 本体の楽観的ロック（xmin）に
/// 影響を与えないよう分離されています。
/// </remarks>
public class WorkspaceItemSearchIndex
{
    /// <summary>
    /// ワークスペースアイテムID（主キー、外部キー）
    /// </summary>
    public int WorkspaceItemId { get; set; }

    /// <summary>
    /// プレーンテキスト形式の本文（pgroonga 検索対象）
    /// </summary>
    public string RawBody { get; set; } = string.Empty;

    /// <summary>
    /// 全文検索用の統合テキスト（Subject + Code + TagNames + RawBody）
    /// pgroonga のメインターゲット
    /// </summary>
    public string FullText { get; set; } = string.Empty;

    /// <summary>
    /// 更新日時
    /// </summary>
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// ナビゲーションプロパティ：ワークスペースアイテム
    /// </summary>
    public WorkspaceItem? WorkspaceItem { get; set; }
}
