using System.ComponentModel.DataAnnotations;

namespace Pecus.Libs.DB.Models;

/// <summary>
/// 組織エンティティ
/// </summary>
public class Organization
{
    /// <summary>
    /// 組織ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 組織名
    /// </summary>
    public required string Name { get; set; }

    /// <summary>
    /// 組織コード
    /// </summary>
    public string? Code { get; set; }

    /// <summary>
    /// 組織の説明
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// 代表者名
    /// </summary>
    public string? RepresentativeName { get; set; }

    /// <summary>
    /// 電話番号
    /// </summary>
    public required string PhoneNumber { get; set; }

    /// <summary>
    /// メールアドレス
    /// </summary>
    public string? Email { get; set; }

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
    /// この組織に所属するユーザー
    /// </summary>
    public ICollection<User> Users { get; set; } = new List<User>();

    /// <summary>
    /// この組織に所属するワークスペース
    /// </summary>
    public ICollection<Workspace> Workspaces { get; set; } = new List<Workspace>();

    /// <summary>
    /// この組織で管理されているタグ
    /// </summary>
    public ICollection<Tag> Tags { get; set; } = new List<Tag>();

    /// <summary>
    /// この組織で管理されているスキル
    /// </summary>
    public ICollection<Skill> Skills { get; set; } = new List<Skill>();

    /// <summary>
    /// 楽観的ロック用タイムスタンプ
    /// </summary>
    [Timestamp]
    public byte[]? RowVersion { get; set; }
}
