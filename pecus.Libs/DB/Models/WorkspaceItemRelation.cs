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
    /// 関連タイプ（オプション）
    /// プロジェクト管理ツールでよく使われる関連タイプ:
    /// - "related": 一般的な関連（双方向）
    /// - "blocks": これがあれを阻止している（A → B）
    /// - "blocked_by": これがあれに阻止されている（A ← B）
    /// - "depends_on": これがあれに依存している（A → B）
    /// - "duplicates": これがあれの重複（双方向）
    /// - "subtask_of": これがあれのサブタスク（A → B）
    /// - "parent_of": これがあれの親タスク（A → B）
    /// - "relates_to": これがあれに関連している（双方向）
    /// - null: 関連タイプを指定しない場合（デフォルトで一般的な関連として扱う）
    /// </summary>
    [MaxLength(50)]
    [Column("relation_type")]
    public string? RelationType { get; set; }

    /// <summary>
    /// 作成日時
    /// </summary>
    [Required]
    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

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
