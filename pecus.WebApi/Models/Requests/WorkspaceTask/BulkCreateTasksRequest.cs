using Pecus.Libs.DB.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.WorkspaceTask;

/// <summary>
/// 一括タスク作成リクエスト
/// </summary>
public class BulkCreateTasksRequest
{
    /// <summary>
    /// 作成するタスクのリスト
    /// </summary>
    [Required(ErrorMessage = "タスクリストは必須です。")]
    [MinLength(1, ErrorMessage = "少なくとも1つのタスクが必要です。")]
    public required List<BulkTaskItem> Tasks { get; set; }
}

/// <summary>
/// 一括作成用のタスク項目
/// </summary>
public class BulkTaskItem
{
    /// <summary>
    /// タスク内容
    /// </summary>
    [Required(ErrorMessage = "タスク内容は必須です。")]
    [MaxLength(2000, ErrorMessage = "タスク内容は2000文字以内で入力してください。")]
    public required string Content { get; set; }

    /// <summary>
    /// タスク種類ID
    /// </summary>
    [Required(ErrorMessage = "タスクの種類は必須です。")]
    [Range(1, int.MaxValue, ErrorMessage = "タスクの種類を選択してください。")]
    public int TaskTypeId { get; set; }

    /// <summary>
    /// 担当ユーザーID
    /// </summary>
    [Required(ErrorMessage = "担当者は必須です。")]
    public int AssignedUserId { get; set; }

    /// <summary>
    /// 優先度（NULL の場合は Medium として扱う）
    /// </summary>
    public TaskPriority? Priority { get; set; }

    /// <summary>
    /// 開始日
    /// </summary>
    public DateOnly? StartDate { get; set; }

    /// <summary>
    /// 期限日（必須）
    /// </summary>
    [Required(ErrorMessage = "期限日は必須です。")]
    public DateOnly DueDate { get; set; }

    /// <summary>
    /// 予定工数（時間）（人間が手動入力、AIの推定値は使用しない）
    /// </summary>
    [Range(0, 10000, ErrorMessage = "予定工数は0〜10000時間の範囲で指定してください。")]
    public decimal? EstimatedHours { get; set; }

    /// <summary>
    /// 既存タスクを先行タスクとして指定する場合のタスクID配列
    /// PredecessorIndicesとの併用不可（どちらか一方のみ指定）
    /// </summary>
    public int[]? PredecessorTaskIds { get; set; }

    /// <summary>
    /// 同一リクエスト内での先行タスクのインデックス配列（0始まり）
    /// PredecessorTaskIdsとの併用不可（どちらか一方のみ指定）
    /// </summary>
    public int[]? PredecessorIndices { get; set; }
}
