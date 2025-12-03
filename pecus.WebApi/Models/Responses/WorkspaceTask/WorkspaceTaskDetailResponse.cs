using Pecus.Libs.DB.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.WorkspaceTask;

/// <summary>
/// ワークスペースタスク詳細レスポンス
/// </summary>
public class WorkspaceTaskDetailResponse : IConflictModel
{
    /// <summary>
    /// タスクID
    /// </summary>
    [Required]
    public required int Id { get; set; }

    /// <summary>
    /// ワークスペースアイテムID
    /// </summary>
    public int WorkspaceItemId { get; set; }

    /// <summary>
    /// ワークスペースID
    /// </summary>
    public int WorkspaceId { get; set; }

    /// <summary>
    /// 組織ID
    /// </summary>
    public int OrganizationId { get; set; }

    /// <summary>
    /// 担当ユーザーID
    /// </summary>
    public int AssignedUserId { get; set; }

    /// <summary>
    /// 担当ユーザー名
    /// </summary>
    public string? AssignedUsername { get; set; }

    /// <summary>
    /// 担当ユーザーアバターURL
    /// </summary>
    public string? AssignedAvatarUrl { get; set; }

    /// <summary>
    /// 作成ユーザーID
    /// </summary>
    public int CreatedByUserId { get; set; }

    /// <summary>
    /// 作成ユーザー名
    /// </summary>
    public string? CreatedByUsername { get; set; }

    /// <summary>
    /// 作成ユーザーアバターURL
    /// </summary>
    public string? CreatedByAvatarUrl { get; set; }

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
    public int ProgressPercentage { get; set; }

    /// <summary>
    /// 完了フラグ
    /// </summary>
    public bool IsCompleted { get; set; }

    /// <summary>
    /// タスク完了日時
    /// </summary>
    public DateTime? CompletedAt { get; set; }

    /// <summary>
    /// 破棄状態
    /// </summary>
    public bool IsDiscarded { get; set; }

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
    public int DisplayOrder { get; set; }

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// 更新日時
    /// </summary>
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// 楽観的ロック用のRowVersion
    /// </summary>
    [Required]
    public required uint RowVersion { get; set; }
}
