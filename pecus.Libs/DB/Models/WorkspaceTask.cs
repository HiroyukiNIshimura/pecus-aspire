using Pecus.Libs.DB.Models.Enums;
using System.ComponentModel.DataAnnotations.Schema;

namespace Pecus.Libs.DB.Models;

/// <summary>
/// ワークスペースタスクエンティティ
/// ワークスペースアイテムに対する作業タスクを管理します
/// </summary>
public class WorkspaceTask
{
    /// <summary>
    /// タスクID（主キー）
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// ワークスペースアイテムID（外部キー）
    /// </summary>
    public int WorkspaceItemId { get; set; }

    /// <summary>
    /// ワークスペースID（検索効率化のため直接保持）
    /// </summary>
    public int WorkspaceId { get; set; }

    /// <summary>
    /// 組織ID（検索効率化のため直接保持）
    /// </summary>
    public int OrganizationId { get; set; }

    /// <summary>
    /// 担当ユーザーID（外部キー）
    /// </summary>
    public int AssignedUserId { get; set; }

    /// <summary>
    /// 作成ユーザーID（外部キー）
    /// </summary>
    public int CreatedByUserId { get; set; }

    /// <summary>
    /// タスク内容
    /// </summary>
    public string Content { get; set; } = string.Empty;

    /// <summary>
    /// タスクの種類
    /// </summary>
    public TaskType TaskType { get; set; }

    /// <summary>
    /// 優先度（NULL の場合は Medium として扱う）
    /// </summary>
    public TaskPriority? Priority { get; set; }

    /// <summary>
    /// 開始日時
    /// </summary>
    public DateTime? StartDate { get; set; }

    /// <summary>
    /// 期限日時
    /// </summary>
    public DateTime? DueDate { get; set; }

    /// <summary>
    /// 予定工数（時間）
    /// </summary>
    public decimal? EstimatedHours { get; set; }

    /// <summary>
    /// 実績工数（時間）
    /// </summary>
    public decimal? ActualHours { get; set; }

    /// <summary>
    /// 進捗率（0-100）
    /// </summary>
    public int ProgressPercentage { get; set; } = 0;

    /// <summary>
    /// 完了フラグ
    /// </summary>
    public bool IsCompleted { get; set; } = false;

    /// <summary>
    /// タスク完了日時
    /// </summary>
    public DateTime? CompletedAt { get; set; }

    /// <summary>
    /// 破棄状態（完了せずタスクを行うのをやめた状態）
    /// </summary>
    public bool IsDiscarded { get; set; } = false;

    /// <summary>
    /// 破棄日時
    /// </summary>
    public DateTime? DiscardedAt { get; set; }

    /// <summary>
    /// 破棄理由
    /// </summary>
    public string? DiscardReason { get; set; }

    /// <summary>
    /// 表示順序
    /// </summary>
    public int DisplayOrder { get; set; } = 0;

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// 更新日時
    /// </summary>
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // ナビゲーションプロパティ

    /// <summary>
    /// 関連するワークスペースアイテム
    /// </summary>
    [ForeignKey(nameof(WorkspaceItemId))]
    public WorkspaceItem WorkspaceItem { get; set; } = null!;

    /// <summary>
    /// 関連するワークスペース
    /// </summary>
    [ForeignKey(nameof(WorkspaceId))]
    public Workspace Workspace { get; set; } = null!;

    /// <summary>
    /// 関連する組織
    /// </summary>
    [ForeignKey(nameof(OrganizationId))]
    public Organization Organization { get; set; } = null!;

    /// <summary>
    /// 担当ユーザー
    /// </summary>
    [ForeignKey(nameof(AssignedUserId))]
    public User AssignedUser { get; set; } = null!;

    /// <summary>
    /// 作成ユーザー
    /// </summary>
    [ForeignKey(nameof(CreatedByUserId))]
    public User CreatedByUser { get; set; } = null!;

    /// <summary>
    /// タスクタグ（中間テーブル）
    /// </summary>
    public ICollection<TaskTag> TaskTags { get; set; } = new List<TaskTag>();

    /// <summary>
    /// タスクコメント
    /// </summary>
    public ICollection<TaskComment> TaskComments { get; set; } = new List<TaskComment>();
}
