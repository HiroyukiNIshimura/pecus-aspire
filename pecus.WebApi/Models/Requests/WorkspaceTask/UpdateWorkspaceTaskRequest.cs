using Pecus.Libs.DB.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.WorkspaceTask;

/// <summary>
/// ワークスペースタスク更新リクエスト
/// </summary>
public class UpdateWorkspaceTaskRequest
{
    /// <summary>
    /// タスク内容
    /// </summary>
    [MaxLength(2000, ErrorMessage = "タスク内容は2000文字以内で入力してください。")]
    public string? Content { get; set; }

    /// <summary>
    /// タスクの種類
    /// </summary>
    public TaskType? TaskType { get; set; }

    /// <summary>
    /// 担当ユーザーID
    /// </summary>
    public int? AssignedUserId { get; set; }

    /// <summary>
    /// 優先度
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
    [Range(0, 10000, ErrorMessage = "予定工数は0〜10000時間の範囲で指定してください。")]
    public decimal? EstimatedHours { get; set; }

    /// <summary>
    /// 実績工数（時間）
    /// </summary>
    [Range(0, 10000, ErrorMessage = "実績工数は0〜10000時間の範囲で指定してください。")]
    public decimal? ActualHours { get; set; }

    /// <summary>
    /// 進捗率（0-100）
    /// </summary>
    [Range(0, 100, ErrorMessage = "進捗率は0〜100の範囲で指定してください。")]
    public int? ProgressPercentage { get; set; }

    /// <summary>
    /// 完了フラグ
    /// </summary>
    public bool? IsCompleted { get; set; }

    /// <summary>
    /// 破棄状態
    /// </summary>
    public bool? IsDiscarded { get; set; }

    /// <summary>
    /// 破棄理由
    /// </summary>
    [MaxLength(500, ErrorMessage = "破棄理由は500文字以内で入力してください。")]
    public string? DiscardReason { get; set; }

    /// <summary>
    /// 表示順序
    /// </summary>
    [Range(0, int.MaxValue, ErrorMessage = "表示順序は0以上の値を指定してください。")]
    public int? DisplayOrder { get; set; }

    /// <summary>
    /// 楽観的ロック用のRowVersion（必須）
    /// </summary>
    [Required(ErrorMessage = "RowVersionは必須です。")]
    public uint RowVersion { get; set; }
}
