using Pecus.Libs.DB.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.WorkspaceTask;

/// <summary>
/// ワークスペースタスク作成リクエスト
/// </summary>
public class CreateWorkspaceTaskRequest
{
    /// <summary>
    /// タスク内容
    /// </summary>
    [Required(ErrorMessage = "タスク内容は必須です。")]
    [MaxLength(2000, ErrorMessage = "タスク内容は2000文字以内で入力してください。")]
    public string Content { get; set; } = string.Empty;

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
    /// 開始日時(ISO 8601 形式)
    /// </summary>
    public DateTimeOffset? StartDate { get; set; }

    /// <summary>
    /// 期限日時(ISO 8601 形式)（必須）
    /// </summary>
    [Required(ErrorMessage = "期限日時は必須です。")]
    public DateTimeOffset DueDate { get; set; }

    /// <summary>
    /// 予定工数（時間）
    /// </summary>
    [Range(0, 10000, ErrorMessage = "予定工数は0〜10000時間の範囲で指定してください。")]
    public decimal? EstimatedHours { get; set; }

    /// <summary>
    /// 先行タスクID配列（これらのタスクがすべて完了しないと着手できない）
    /// </summary>
    public int[]? PredecessorTaskIds { get; set; }
}