using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace Pecus.Libs.DB.Models;

/// <summary>
/// アクティビティ（操作履歴）エンティティ
/// </summary>
public class Activity
{
    /// <summary>
    /// アクティビティID（主キー）
    /// </summary>
    [Key]
    public long Id { get; set; }

    /// <summary>
    /// ワークスペースID（外部キー、必須）
    /// </summary>
    [Required]
    public int WorkspaceId { get; set; }

    /// <summary>
    /// 対象アイテムのID（WorkspaceItem.Id）
    /// </summary>
    [Required]
    public int ItemId { get; set; }

    /// <summary>
    /// 操作したユーザーID（外部キー、NULL可）
    /// </summary>
    public int? UserId { get; set; }

    /// <summary>
    /// 操作コード（例: "ITEM.CREATE", "ITEM.UPDATE", "ITEM.DELETE"）
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string Action { get; set; } = string.Empty;

    /// <summary>
    /// 操作カテゴリ（集計用、例: "CREATE", "UPDATE", "DELETE"）
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string ActionCategory { get; set; } = string.Empty;

    /// <summary>
    /// 操作日時（UTC）
    /// </summary>
    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// 変更前のデータ（jsonb形式）
    /// </summary>
    [Column(TypeName = "jsonb")]
    public string? BeforeData { get; set; }

    /// <summary>
    /// 変更後のデータ（jsonb形式、任意）
    /// </summary>
    [Column(TypeName = "jsonb")]
    public string? AfterData { get; set; }

    /// <summary>
    /// 拡張メタデータ（jsonb形式、IP・UserAgent・RequestId等）
    /// </summary>
    [Column(TypeName = "jsonb")]
    public string? Metadata { get; set; }

    /// <summary>
    /// システム操作フラグ（ユーザー操作 vs システム自動操作）
    /// </summary>
    public bool IsSystem { get; set; } = false;

    // Navigation Properties

    /// <summary>
    /// ワークスペース（ナビゲーションプロパティ）
    /// </summary>
    public Workspace? Workspace { get; set; }

    /// <summary>
    /// 対象アイテム（ナビゲーションプロパティ）
    /// </summary>
    public WorkspaceItem? Item { get; set; }

    /// <summary>
    /// 操作ユーザー（ナビゲーションプロパティ）
    /// </summary>
    public User? User { get; set; }

    /// <summary>
    /// 楽観的ロック用バージョン番号（PostgreSQL の xmin システムカラム）
    /// </summary>
    public uint RowVersion { get; set; }
}
