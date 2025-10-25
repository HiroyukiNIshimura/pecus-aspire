namespace Pecus.Libs.DB.Models;

/// <summary>
/// ワークスペースアイテムとタグの中間テーブル（多対多関連）
/// </summary>
public class WorkspaceItemTag
{
    /// <summary>
    /// ワークスペースアイテムID（外部キー）
    /// </summary>
    public int WorkspaceItemId { get; set; }

    /// <summary>
    /// タグID（外部キー）
    /// </summary>
    public int TagId { get; set; }

    /// <summary>
    /// タグ付与日時
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// タグ付与者ユーザーID
    /// </summary>
    public int CreatedByUserId { get; set; }

    // Navigation Properties
    /// <summary>
    /// ワークスペースアイテム（ナビゲーションプロパティ）
    /// </summary>
    public WorkspaceItem? WorkspaceItem { get; set; }

    /// <summary>
    /// タグ（ナビゲーションプロパティ）
    /// </summary>
    public Tag? Tag { get; set; }

    /// <summary>
    /// タグ付与者ユーザー（ナビゲーションプロパティ）
    /// </summary>
    public User? CreatedByUser { get; set; }
}
