using Pecus.Libs.DB.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.WorkspaceTask;

/// <summary>
/// ワークスペースタスク詳細レスポンス
/// </summary>
public class WorkspaceTaskDetailResponse : IConflictModel
{
    /// <summary>
    /// リスト内でのインデックス（Reactのkey用）
    /// </summary>
    public int ListIndex { get; set; }

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
    /// ワークスペースアイテム内でのシーケンス番号
    /// </summary>
    public int Sequence { get; set; }

    /// <summary>
    /// ワークスペースID
    /// </summary>
    public int WorkspaceId { get; set; }

    /// <summary>
    /// 組織ID
    /// </summary>
    public int OrganizationId { get; set; }

    // ===== アイテム権限情報（タスク編集権限チェック用） =====

    /// <summary>
    /// アイテムオーナー情報
    /// </summary>
    public UserIdentityResponse ItemOwner { get; set; } = new();

    /// <summary>
    /// アイテム担当者情報
    /// </summary>
    public UserIdentityResponse? ItemAssignee { get; set; }

    /// <summary>
    /// アイテムコミッター情報
    /// </summary>
    public UserIdentityResponse? ItemCommitter { get; set; }

    /// <summary>
    /// タスク担当者情報
    /// </summary>
    public UserIdentityResponse Assigned { get; set; } = new();

    /// <summary>
    /// タスク作成者情報
    /// </summary>
    public UserIdentityResponse CreatedBy { get; set; } = new();

    /// <summary>
    /// タスク完了者情報
    /// </summary>
    public UserIdentityResponse? CompletedBy { get; set; }

    /// <summary>
    /// タスク内容
    /// </summary>
    public string Content { get; set; } = string.Empty;

    /// <summary>
    /// タスク種類ID
    /// </summary>
    public int TaskTypeId { get; set; }

    /// <summary>
    /// タスク種類コード（例: "Bug", "Feature"）
    /// </summary>
    public string? TaskTypeCode { get; set; }

    /// <summary>
    /// タスク種類名（日本語表示名）
    /// </summary>
    public string? TaskTypeName { get; set; }

    /// <summary>
    /// タスク種類アイコン（拡張子なしのファイル名）
    /// </summary>
    public string? TaskTypeIcon { get; set; }

    /// <summary>
    /// 優先度（NULL の場合は Medium として扱う）
    /// </summary>
    public TaskPriority? Priority { get; set; }

    /// <summary>
    /// 開始日時
    /// </summary>
    public DateTimeOffset? StartDate { get; set; }

    /// <summary>
    /// 期限日時（必須）
    /// </summary>
    public DateTimeOffset DueDate { get; set; }

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
    public DateTimeOffset? CompletedAt { get; set; }

    /// <summary>
    /// 破棄状態
    /// </summary>
    public bool IsDiscarded { get; set; }

    /// <summary>
    /// 破棄日時
    /// </summary>
    public DateTimeOffset? DiscardedAt { get; set; }

    /// <summary>
    /// 破棄理由
    /// </summary>
    public string? DiscardReason { get; set; }

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTimeOffset CreatedAt { get; set; }

    /// <summary>
    /// 更新日時
    /// </summary>
    public DateTimeOffset UpdatedAt { get; set; }

    /// <summary>
    /// コメント数
    /// </summary>
    public int CommentCount { get; set; }

    /// <summary>
    /// コメントタイプ別件数（キーは TaskCommentType。NULL は Normal として集計）
    /// </summary>
    public Dictionary<TaskCommentType, int> CommentTypeCounts { get; set; } = new();

    /// <summary>
    /// 先行タスクID配列（これらのタスクがすべて完了しないと着手できない）
    /// </summary>
    public int[] PredecessorTaskIds { get; set; } = [];

    /// <summary>
    /// 先行タスク情報リスト
    /// </summary>
    public List<PredecessorTaskInfo> PredecessorTasks { get; set; } = [];

    /// <summary>
    /// このタスクを待っている後続タスク数
    /// </summary>
    public int SuccessorTaskCount { get; set; }

    /// <summary>
    /// 楽観的ロック用のRowVersion
    /// </summary>
    [Required]
    public required uint RowVersion { get; set; }
}

/// <summary>
/// 先行タスク情報
/// </summary>
public class PredecessorTaskInfo
{
    /// <summary>
    /// タスクID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// タスクシーケンス番号（アイテム内の順序）
    /// </summary>
    public int Sequence { get; set; }

    /// <summary>
    /// タスク内容
    /// </summary>
    public string Content { get; set; } = string.Empty;

    /// <summary>
    /// 完了フラグ
    /// </summary>
    public bool IsCompleted { get; set; }

    /// <summary>
    /// ワークスペースアイテムコード（例: "PROJ-42"）
    /// </summary>
    public string? WorkspaceItemCode { get; set; }
}