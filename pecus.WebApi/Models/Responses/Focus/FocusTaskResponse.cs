using Pecus.Libs.DB.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.Focus;

/// <summary>
/// やることピックアップタスクレスポンス
/// </summary>
public class FocusTaskResponse
{
    /// <summary>
    /// タスクID
    /// </summary>
    [Required]
    public required int Id { get; set; }

    /// <summary>
    /// タスクシーケンス番号（アイテム内の順序）
    /// </summary>
    [Required]
    public required int Sequence { get; set; }

    /// <summary>
    /// ワークスペースアイテムID
    /// </summary>
    [Required]
    public required int WorkspaceItemId { get; set; }

    /// <summary>
    /// ワークスペースID
    /// </summary>
    [Required]
    public required int WorkspaceId { get; set; }

    /// <summary>
    /// ワークスペースコード
    /// </summary>
    public string? WorkspaceCode { get; set; }

    /// <summary>
    /// ワークスペース名
    /// </summary>
    public string? WorkspaceName { get; set; }

    /// <summary>
    /// アイテムコード（PROJ-42形式）
    /// </summary>
    [Required]
    public required string ItemCode { get; set; }

    /// <summary>
    /// タスク内容
    /// </summary>
    [Required]
    public required string Content { get; set; }

    /// <summary>
    /// アイテム件名
    /// </summary>
    public string? ItemSubject { get; set; }

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
    /// 優先度
    /// </summary>
    public TaskPriority? Priority { get; set; }

    /// <summary>
    /// 期限日時
    /// </summary>
    [Required]
    public required DateTimeOffset DueDate { get; set; }

    /// <summary>
    /// 予定工数（時間）
    /// </summary>
    public decimal? EstimatedHours { get; set; }

    /// <summary>
    /// 進捗率（0-100）
    /// </summary>
    [Required]
    public required int ProgressPercentage { get; set; }

    /// <summary>
    /// 総合スコア（高いほど優先度が高い）
    /// </summary>
    [Required]
    public required decimal TotalScore { get; set; }

    /// <summary>
    /// 後続タスク数（このタスクを待っているタスクの数）
    /// </summary>
    [Required]
    public required int SuccessorCount { get; set; }

    /// <summary>
    /// 後続タスク情報（先頭1件、存在する場合）
    /// </summary>
    public SuccessorTaskInfo? SuccessorTask { get; set; }

    /// <summary>
    /// 先行タスクIDの配列
    /// </summary>
    public int[] PredecessorTaskIds { get; set; } = [];

    /// <summary>
    /// 先行タスク情報リスト
    /// </summary>
    public List<PredecessorTaskInfo> PredecessorTasks { get; set; } = [];

    /// <summary>
    /// スコア詳細（デバッグ・説明用）
    /// </summary>
    public TaskScoreDetail? ScoreDetail { get; set; }
}