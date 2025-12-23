using Pecus.Libs.DB.Models.Enums;

namespace Pecus.Libs.Focus.Models;

/// <summary>
/// やることリストのタスク情報（Libs内部用軽量モデル）
/// </summary>
public class FocusTaskInfo
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
    /// ワークスペースアイテムID
    /// </summary>
    public int WorkspaceItemId { get; set; }

    /// <summary>
    /// ワークスペースID
    /// </summary>
    public int WorkspaceId { get; set; }

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
    public string ItemCode { get; set; } = string.Empty;

    /// <summary>
    /// タスク内容
    /// </summary>
    public string Content { get; set; } = string.Empty;

    /// <summary>
    /// アイテム件名
    /// </summary>
    public string? ItemSubject { get; set; }

    /// <summary>
    /// タスク種類名
    /// </summary>
    public string? TaskTypeName { get; set; }

    /// <summary>
    /// 優先度
    /// </summary>
    public TaskPriority? Priority { get; set; }

    /// <summary>
    /// 期限日時
    /// </summary>
    public DateTimeOffset DueDate { get; set; }

    /// <summary>
    /// 予定工数（時間）
    /// </summary>
    public decimal? EstimatedHours { get; set; }

    /// <summary>
    /// 進捗率（0-100）
    /// </summary>
    public int ProgressPercentage { get; set; }

    /// <summary>
    /// 総合スコア（高いほど優先度が高い）
    /// </summary>
    public decimal TotalScore { get; set; }

    /// <summary>
    /// 後続タスク数（このタスクを待っているタスクの数）
    /// </summary>
    public int SuccessorCount { get; set; }

    /// <summary>
    /// 着手可能かどうか（先行タスクなし or 先行タスク完了済み）
    /// </summary>
    public bool CanStart { get; set; }

    /// <summary>
    /// 先行タスクのアイテムコード（存在する場合）
    /// </summary>
    public string? PredecessorItemCode { get; set; }

    /// <summary>
    /// 先行タスクの内容（存在する場合）
    /// </summary>
    public string? PredecessorContent { get; set; }
}

/// <summary>
/// やることリスト取得結果
/// </summary>
public class FocusTaskResult
{
    /// <summary>
    /// 今すぐ取り組むべきタスク（着手可能、スコア上位）
    /// </summary>
    public List<FocusTaskInfo> FocusTasks { get; set; } = new();

    /// <summary>
    /// 待機中タスク（先行タスク未完了）
    /// </summary>
    public List<FocusTaskInfo> WaitingTasks { get; set; } = new();

    /// <summary>
    /// 対象タスクの総数
    /// </summary>
    public int TotalTaskCount { get; set; }
}
