using Pecus.Libs.DB.Models.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Pecus.Libs.DB.Models;

/// <summary>
/// ワークスペースアイテム間の関連を表すエンティティ
/// </summary>
[Table("workspace_item_relations")]
public class WorkspaceItemRelation
{
    /// <summary>
    /// ID
    /// </summary>
    [Key]
    [Column("id")]
    public int Id { get; set; }

    /// <summary>
    /// 関連元アイテムID
    /// </summary>
    [Required]
    [Column("from_item_id")]
    public int FromItemId { get; set; }

    /// <summary>
    /// 関連先アイテムID
    /// </summary>
    [Required]
    [Column("to_item_id")]
    public int ToItemId { get; set; }

    /// <summary>
    /// 関連タイプ（NULL の場合は Related として扱う）
    /// </summary>
    [Column("relation_type")]
    public RelationType? RelationType { get; set; }

    /// <summary>
    /// 作成日時
    /// </summary>
    [Required]
    [Column("created_at")]
    public DateTimeOffset CreatedAt { get; set; }

    /// <summary>
    /// 作成者ID
    /// </summary>
    [Required]
    [Column("created_by_user_id")]
    public int CreatedByUserId { get; set; }

    // ナビゲーションプロパティ

    /// <summary>
    /// 関連元アイテム
    /// </summary>
    [ForeignKey(nameof(FromItemId))]
    public WorkspaceItem? FromItem { get; set; }

    /// <summary>
    /// 関連先アイテム
    /// </summary>
    [ForeignKey(nameof(ToItemId))]
    public WorkspaceItem? ToItem { get; set; }

    /// <summary>
    /// 作成者
    /// </summary>
    [ForeignKey(nameof(CreatedByUserId))]
    public User? CreatedByUser { get; set; }

    /// <summary>
    /// 楽観的ロック用バージョン番号（PostgreSQL の xmin システムカラム）
    /// </summary>
    public uint RowVersion { get; set; }
}