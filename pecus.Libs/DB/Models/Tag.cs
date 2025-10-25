namespace Pecus.Libs.DB.Models;

/// <summary>
/// タグエンティティ（組織単位で管理）
/// </summary>
public class Tag
{
    /// <summary>
    /// タグID（主キー）
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 組織ID（外部キー）
    /// </summary>
    public int OrganizationId { get; set; }

    /// <summary>
    /// タグ名
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// 作成者ユーザーID
    /// </summary>
    public int CreatedByUserId { get; set; }

    /// <summary>
    /// 更新日時
    /// </summary>
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    /// <summary>
    /// 組織（ナビゲーションプロパティ）
    /// </summary>
    public Organization? Organization { get; set; }

    /// <summary>
    /// 作成者ユーザー（ナビゲーションプロパティ）
    /// </summary>
    public User? CreatedByUser { get; set; }

    /// <summary>
    /// このタグが付与されているアイテムとの関連（多対多）
    /// </summary>
    public ICollection<WorkspaceItemTag> WorkspaceItemTags { get; set; } =
        new List<WorkspaceItemTag>();
}
