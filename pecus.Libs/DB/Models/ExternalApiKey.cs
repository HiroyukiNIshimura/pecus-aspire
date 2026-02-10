using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Pecus.Libs.DB.Models;

/// <summary>
/// 外部公開API用のAPIキーエンティティ
/// 組織ごとに複数発行可能。DBにはSHA-256ハッシュのみ保存し、平文は発行時のみ返却する。
/// </summary>
public class ExternalApiKey
{
    /// <summary>
    /// APIキーID（主キー、自動採番）
    /// </summary>
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// 組織ID（外部キー）
    /// </summary>
    [Required]
    public int OrganizationId { get; set; }

    /// <summary>
    /// キー名（用途識別用）
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// キーの先頭8文字（一覧表示・識別用）
    /// </summary>
    [Required]
    [MaxLength(8)]
    public string KeyPrefix { get; set; } = string.Empty;

    /// <summary>
    /// SHA-256 ハッシュ（Base64）。平文キーは保存しない。
    /// </summary>
    [Required]
    [MaxLength(64)]
    public string KeyHash { get; set; } = string.Empty;

    /// <summary>
    /// 有効期限（UTC）
    /// </summary>
    [Required]
    public DateTimeOffset ExpiresAt { get; set; }

    /// <summary>
    /// 失効済みフラグ
    /// </summary>
    [Required]
    public bool IsRevoked { get; set; }

    /// <summary>
    /// 最終使用日時（UTC）
    /// </summary>
    public DateTimeOffset? LastUsedAt { get; set; }

    /// <summary>
    /// 作成者ユーザーID
    /// </summary>
    [Required]
    public int CreatedByUserId { get; set; }

    /// <summary>
    /// 作成日時（UTC）
    /// </summary>
    [Required]
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    // Navigation Properties

    /// <summary>
    /// 組織（ナビゲーションプロパティ）
    /// </summary>
    [ForeignKey(nameof(OrganizationId))]
    public Organization Organization { get; set; } = null!;

    /// <summary>
    /// 作成者ユーザー（ナビゲーションプロパティ）
    /// </summary>
    [ForeignKey(nameof(CreatedByUserId))]
    public User CreatedByUser { get; set; } = null!;

    /// <summary>
    /// 楽観的ロック用バージョン番号（PostgreSQL の xmin システムカラム）
    /// </summary>
    public uint RowVersion { get; set; }
}
