using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Pecus.Libs.DB.Models;

/// <summary>
/// タスクコメントエンティティ
/// タスクに対するコメントや変更履歴を管理します
/// </summary>
public class TaskComment
{
    /// <summary>
    /// コメントID（主キー）
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// タスクID（外部キー）
    /// </summary>
    public int WorkspaceTaskId { get; set; }

    /// <summary>
    /// コメントしたユーザーID（外部キー）
    /// </summary>
    public int UserId { get; set; }

    /// <summary>
    /// コメント内容
    /// </summary>
    public string Content { get; set; } = string.Empty;

    /// <summary>
    /// コメントタイプ（通常コメント、ステータス変更、担当者変更など）
    /// </summary>
    public string CommentType { get; set; } = "Normal";

    /// <summary>
    /// 変更前の値（履歴用、JSON形式）
    /// </summary>
    public string? BeforeValue { get; set; }

    /// <summary>
    /// 変更後の値（履歴用、JSON形式）
    /// </summary>
    public string? AfterValue { get; set; }

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// 更新日時
    /// </summary>
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// 削除済みフラグ（論理削除）
    /// </summary>
    public bool IsDeleted { get; set; } = false;

    /// <summary>
    /// 削除日時
    /// </summary>
    public DateTime? DeletedAt { get; set; }

    // ナビゲーションプロパティ

    /// <summary>
    /// 関連するワークスペースタスク
    /// </summary>
    [ForeignKey(nameof(WorkspaceTaskId))]
    public WorkspaceTask WorkspaceTask { get; set; } = null!;

    /// <summary>
    /// コメントしたユーザー
    /// </summary>
    [ForeignKey(nameof(UserId))]
    public User User { get; set; } = null!;

    /// <summary>
    /// 楽観的ロック用バージョン番号（PostgreSQL の xmin システムカラム）
    /// </summary>
    public uint RowVersion { get; set; }
}
