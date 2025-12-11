using Pecus.Libs.DB.Models.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Pecus.Libs.DB.Models;

/// <summary>
/// アクティビティ（操作履歴）エンティティ
/// 監査目的ではなく、分析・集計・タイムライン表示を目的とする
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
    /// 操作したユーザーID（NULL = システム操作）
    /// </summary>
    public int? UserId { get; set; }

    /// <summary>
    /// 操作タイプ（enum）
    /// </summary>
    [Required]
    public ActivityActionType ActionType { get; set; }

    /// <summary>
    /// 操作の詳細データ（jsonb形式）
    /// 例: { "from": "TODO", "to": "DOING" }, { "fileName": "doc.pdf", "fileSize": 12345 }
    /// </summary>
    [Column(TypeName = "jsonb")]
    public string? Details { get; set; }

    /// <summary>
    /// 操作日時（UTC）
    /// </summary>
    [Required]
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

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