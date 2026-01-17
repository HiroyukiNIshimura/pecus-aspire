using Pecus.Libs.DB.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.WorkspaceTask;

/// <summary>
/// タスクフローマップレスポンス
/// アイテム内のタスク依存関係を可視化するためのデータ
/// </summary>
public class TaskFlowMapResponse
{
    /// <summary>
    /// クリティカルパス（合計所要期間が最長の依存チェーン）
    /// 期間は各タスクの StartDate（なければ前タスクの DueDate、最初のタスクなら CreatedAt）から DueDate までの日数を合計して算出
    /// </summary>
    [Required]
    public required List<TaskFlowNode> CriticalPath { get; set; }

    /// <summary>
    /// その他の依存チェーン（クリティカルパス以外）
    /// </summary>
    [Required]
    public required List<List<TaskFlowNode>> OtherChains { get; set; }

    /// <summary>
    /// 独立タスク（依存関係なし）
    /// </summary>
    [Required]
    public required List<TaskFlowNode> IndependentTasks { get; set; }

    /// <summary>
    /// サマリ情報
    /// </summary>
    [Required]
    public required TaskFlowSummary Summary { get; set; }
}

/// <summary>
/// タスクフローマップのサマリ情報
/// </summary>
public class TaskFlowSummary
{
    /// <summary>
    /// 総タスク数
    /// </summary>
    [Required]
    public required int TotalCount { get; set; }

    /// <summary>
    /// 着手可能タスク数（先行タスクなし or 完了済み、かつ未完了・未破棄）
    /// </summary>
    [Required]
    public required int ReadyCount { get; set; }

    /// <summary>
    /// 待機中タスク数（先行タスク未完了）
    /// </summary>
    [Required]
    public required int WaitingCount { get; set; }

    /// <summary>
    /// 進行中タスク数（進捗 > 0 かつ未完了）
    /// </summary>
    [Required]
    public required int InProgressCount { get; set; }

    /// <summary>
    /// 完了タスク数
    /// </summary>
    [Required]
    public required int CompletedCount { get; set; }

    /// <summary>
    /// 破棄タスク数
    /// </summary>
    [Required]
    public required int DiscardedCount { get; set; }
}

/// <summary>
/// タスクフローマップのノード（個別タスク）
/// </summary>
public class TaskFlowNode
{
    /// <summary>
    /// タスクID
    /// </summary>
    [Required]
    public required int Id { get; set; }

    /// <summary>
    /// タスクシーケンス番号（アイテム内での通し番号）
    /// </summary>
    [Required]
    public required int Sequence { get; set; }

    /// <summary>
    /// タスク内容
    /// </summary>
    [Required]
    public required string Content { get; set; }

    /// <summary>
    /// タスク種類ID
    /// </summary>
    public int? TaskTypeId { get; set; }

    /// <summary>
    /// タスク種類名
    /// </summary>
    public string? TaskTypeName { get; set; }

    /// <summary>
    /// タスク種類アイコン
    /// </summary>
    public string? TaskTypeIcon { get; set; }

    /// <summary>
    /// 優先度
    /// </summary>
    public TaskPriority? Priority { get; set; }

    /// <summary>
    /// 期限日時
    /// </summary>
    public DateTimeOffset? DueDate { get; set; }

    /// <summary>
    /// 進捗率（0-100）
    /// </summary>
    [Required]
    public required int ProgressPercentage { get; set; }

    /// <summary>
    /// 完了フラグ
    /// </summary>
    [Required]
    public required bool IsCompleted { get; set; }

    /// <summary>
    /// 破棄フラグ
    /// </summary>
    [Required]
    public required bool IsDiscarded { get; set; }

    /// <summary>
    /// 担当ユーザーID
    /// </summary>
    public int? AssignedUserId { get; set; }

    /// <summary>
    /// 担当ユーザー名
    /// </summary>
    public string? AssignedUsername { get; set; }

    /// <summary>
    /// 担当ユーザーアバターURL
    /// </summary>
    public string? AssignedAvatarUrl { get; set; }

    /// <summary>
    /// 完了者ユーザーID
    /// </summary>
    public int? CompletedByUserId { get; set; }

    /// <summary>
    /// 完了者ユーザー名
    /// </summary>
    public string? CompletedByUsername { get; set; }

    /// <summary>
    /// 完了者ユーザーアバターURL
    /// </summary>
    public string? CompletedByAvatarUrl { get; set; }

    /// <summary>
    /// 着手可能か（先行タスクなし or 完了済み、かつ自身が未完了・未破棄）
    /// </summary>
    [Required]
    public required bool CanStart { get; set; }

    /// <summary>
    /// 先行タスクID
    /// </summary>
    public int? PredecessorTaskId { get; set; }

    /// <summary>
    /// 先行タスク情報（待機中の場合）
    /// </summary>
    public TaskFlowPredecessorInfo? PredecessorTask { get; set; }

    /// <summary>
    /// 後続タスク数
    /// </summary>
    [Required]
    public required int SuccessorCount { get; set; }

    /// <summary>
    /// 所要期間（日数）
    /// StartDate（なければ前タスクのDueDate、最初のタスクならCreatedAt）からDueDateまでの期間
    /// 完了・破棄済みの場合はnull
    /// </summary>
    public decimal? DurationDays { get; set; }

    /// <summary>
    /// 先行タスクとの期限日コンフリクトがあるか
    /// 先行タスクの期限日が自タスクの期限日より後の場合にtrue
    /// </summary>
    public bool HasDueDateConflict { get; set; }
}

/// <summary>
/// タスクフローマップ用の先行タスク情報
/// </summary>
public class TaskFlowPredecessorInfo
{
    /// <summary>
    /// タスクID
    /// </summary>
    [Required]
    public required int Id { get; set; }

    /// <summary>
    /// タスクシーケンス番号
    /// </summary>
    [Required]
    public required int Sequence { get; set; }

    /// <summary>
    /// タスク内容
    /// </summary>
    [Required]
    public required string Content { get; set; }

    /// <summary>
    /// 完了フラグ
    /// </summary>
    [Required]
    public required bool IsCompleted { get; set; }
}