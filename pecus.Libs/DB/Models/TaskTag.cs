using System.ComponentModel.DataAnnotations.Schema;

namespace Pecus.Libs.DB.Models;

/// <summary>
/// タスクタグ中間テーブルエンティティ
/// タスクとタグの多対多リレーションを管理します
/// </summary>
public class TaskTag
{
    /// <summary>
    /// タスクID（複合主キー）
    /// </summary>
    public int WorkspaceTaskId { get; set; }

    /// <summary>
    /// タグID（複合主キー）
    /// </summary>
    public int TagId { get; set; }

    /// <summary>
    /// タグ追加ユーザーID
    /// </summary>
    public int CreatedByUserId { get; set; }

    /// <summary>
    /// タグ追加日時
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // ナビゲーションプロパティ

    /// <summary>
    /// 関連するワークスペースタスク
    /// </summary>
    [ForeignKey(nameof(WorkspaceTaskId))]
    public WorkspaceTask WorkspaceTask { get; set; } = null!;

    /// <summary>
    /// 関連するタグ
    /// </summary>
    [ForeignKey(nameof(TagId))]
    public Tag Tag { get; set; } = null!;

    /// <summary>
    /// タグを追加したユーザー
    /// </summary>
    [ForeignKey(nameof(CreatedByUserId))]
    public User CreatedByUser { get; set; } = null!;
}
