using Pecus.Libs.DB.Models.Enums;

namespace Pecus.Libs.DB.Models;

/// <summary>
/// ロールエンティティ
/// </summary>
public class Role
{
    /// <summary>
    /// ロールID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// ロール名
    /// </summary>
    public required SystemRole Name { get; set; }

    /// <summary>
    /// ロールの説明
    /// </summary>
    public string? Description { get; set; }

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
    /// このロールに関連付けられた権限
    /// </summary>
    public ICollection<Permission> Permissions { get; set; } = new List<Permission>();

    /// <summary>
    /// このロールを持つユーザー
    /// </summary>
    public ICollection<User> Users { get; set; } = new List<User>();

    /// <summary>
    /// 楽観的ロック用バージョン番号（PostgreSQL の xmin システムカラム）
    /// </summary>
    public uint RowVersion { get; set; }
}