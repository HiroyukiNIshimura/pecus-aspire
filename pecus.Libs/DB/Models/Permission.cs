namespace Pecus.Libs.DB.Models;

/// <summary>
/// 権限エンティティ
/// </summary>
public class Permission
{
    /// <summary>
    /// 権限ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 権限名(例: "User.Read", "User.Write", "Admin.Access")
    /// </summary>
    public required string Name { get; set; }

    /// <summary>
    /// 権限の説明
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// 権限カテゴリ(例: "User", "Admin", "Report")
    /// </summary>
    public string? Category { get; set; }

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

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
    /// この権限を持つロール
    /// </summary>
    public ICollection<Role> Roles { get; set; } = new List<Role>();

    /// <summary>
    /// 楽観的ロック用バージョン番号（PostgreSQL の xmin システムカラム）
    /// </summary>
    public uint RowVersion { get; set; }
}