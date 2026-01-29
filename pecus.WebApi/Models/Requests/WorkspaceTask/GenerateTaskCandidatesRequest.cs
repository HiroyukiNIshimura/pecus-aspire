using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.WorkspaceTask;

/// <summary>
/// タスク候補生成リクエスト
/// </summary>
public class GenerateTaskCandidatesRequest
{
    /// <summary>
    /// プロジェクト開始日
    /// </summary>
    [Required(ErrorMessage = "開始日は必須です。")]
    public DateOnly StartDate { get; set; }

    /// <summary>
    /// プロジェクト完了日（アイテムのDueDateと異なる場合）
    /// </summary>
    public DateOnly? EndDate { get; set; }

    /// <summary>
    /// 追加のコンテキスト情報（ユーザーからの補足）
    /// </summary>
    [MaxLength(2000, ErrorMessage = "追加情報は2000文字以内で入力してください。")]
    public string? AdditionalContext { get; set; }

    /// <summary>
    /// 前回の生成結果へのフィードバック（イテレーション用）
    /// </summary>
    [MaxLength(2000, ErrorMessage = "フィードバックは2000文字以内で入力してください。")]
    public string? Feedback { get; set; }

    /// <summary>
    /// 前回生成されたタスク候補（イテレーション用）
    /// </summary>
    public List<PreviousCandidateRequest>? PreviousCandidates { get; set; }
}

/// <summary>
/// 前回の候補情報（イテレーション用）
/// </summary>
public class PreviousCandidateRequest
{
    /// <summary>
    /// タスク内容
    /// </summary>
    [Required(ErrorMessage = "タスク内容は必須です。")]
    [MaxLength(500, ErrorMessage = "タスク内容は500文字以内で入力してください。")]
    public required string Content { get; set; }

    /// <summary>
    /// 採用されたかどうか
    /// </summary>
    public bool IsAccepted { get; set; }

    /// <summary>
    /// 却下理由（却下の場合）
    /// </summary>
    [MaxLength(500, ErrorMessage = "却下理由は500文字以内で入力してください。")]
    public string? RejectionReason { get; set; }
}
