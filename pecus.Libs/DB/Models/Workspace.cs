namespace Pecus.Libs.DB.Models;

/// <summary>
/// ワークスペースエンティティ
/// </summary>
public class Workspace
{
    /// <summary>
    /// ワークスペースID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// ワークスペース名
    /// </summary>
    public required string Name { get; set; }

    /// <summary>
    /// ワークスペースコード
    /// </summary>
    public string? Code { get; set; }

    /// <summary>
    /// ワークスペースの説明
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// 組織ID
    /// </summary>
    public int OrganizationId { get; set; }

    /// <summary>
    /// 所属する組織
    /// </summary>
    public Organization Organization { get; set; } = null!;

    /// <summary>
    /// ジャンルID
    /// </summary>
    public int? GenreId { get; set; }

    /// <summary>
    /// ジャンル
    /// </summary>
    public Genre? Genre { get; set; }

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// 作成者ユーザーID
    /// </summary>
    public int? CreatedByUserId { get; set; }

    /// <summary>
    /// 更新日時
    /// </summary>
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// 更新者ユーザーID
    /// </summary>
    public int? UpdatedByUserId { get; set; }

    /// <summary>
    /// アクティブフラグ
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// このワークスペースに参加しているユーザー
    /// </summary>
    public ICollection<WorkspaceUser> WorkspaceUsers { get; set; } = new List<WorkspaceUser>();

    /// <summary>
    /// このワークスペースに属するアイテム
    /// </summary>
    public ICollection<WorkspaceItem> WorkspaceItems { get; set; } = new List<WorkspaceItem>();
}
