using Pecus.Libs.DB.Models.Enums;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Pecus.Models.Responses.External;

/// <summary>
/// 外部公開用タスク詳細
/// </summary>
public class ExternalTaskDetailResponse
{
    /// <summary>
    /// シーケンス番号（アイテム内一意）
    /// </summary>
    [Required]
    public int Sequence { get; set; }

    /// <summary>
    /// 担当ユーザー
    /// </summary>
    [Required]
    public required ExternalUserRefResponse AssignedUser { get; set; }

    /// <summary>
    /// 作成ユーザー
    /// </summary>
    [Required]
    public required ExternalUserRefResponse CreatedByUser { get; set; }

    /// <summary>
    /// タスク内容
    /// </summary>
    [Required]
    public required string Content { get; set; }

    /// <summary>
    /// タスク種類
    /// </summary>
    [Required]
    public required ExternalTaskTypeRefResponse TaskType { get; set; }

    /// <summary>
    /// 優先度
    /// </summary>
    [JsonConverter(typeof(JsonStringEnumConverter<TaskPriority>))]
    public TaskPriority? Priority { get; set; }

    /// <summary>
    /// 開始日時
    /// </summary>
    public DateTimeOffset? StartDate { get; set; }

    /// <summary>
    /// 期限日時
    /// </summary>
    [Required]
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
    [Required]
    public int ProgressPercentage { get; set; }

    /// <summary>
    /// 完了フラグ
    /// </summary>
    [Required]
    public bool IsCompleted { get; set; }

    /// <summary>
    /// 完了日時
    /// </summary>
    public DateTimeOffset? CompletedAt { get; set; }

    /// <summary>
    /// 完了ユーザー
    /// </summary>
    public ExternalUserRefResponse? CompletedByUser { get; set; }

    /// <summary>
    /// 破棄情報（IsDiscarded が true の場合のみ設定）
    /// </summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public ExternalTaskDiscardedResponse? Discarded { get; set; }

    /// <summary>
    /// 先行タスク一覧
    /// </summary>
    [Required]
    public required IReadOnlyList<ExternalPredecessorTaskResponse> PredecessorTasks { get; set; }
}