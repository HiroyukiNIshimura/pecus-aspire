using Pecus.Libs.DB.Models;
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

    /// <summary>
    /// 担当者名（チームタスク取得時に使用）
    /// </summary>
    public string? AssignedUserName { get; set; }
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

/// <summary>
/// やることリストのタスク詳細情報（API用、エンティティ参照を含む）
/// </summary>
public class FocusTaskDetailInfo
{
    /// <summary>
    /// タスクエンティティ
    /// </summary>
    public required WorkspaceTask Task { get; set; }

    /// <summary>
    /// 総合スコア
    /// </summary>
    public decimal TotalScore { get; set; }

    /// <summary>
    /// 後続タスク数
    /// </summary>
    public int SuccessorCount { get; set; }

    /// <summary>
    /// 後続タスクの先頭1件
    /// </summary>
    public WorkspaceTask? FirstSuccessor { get; set; }

    /// <summary>
    /// 着手可能かどうか
    /// </summary>
    public bool CanStart { get; set; }

    /// <summary>
    /// スコア詳細
    /// </summary>
    public required FocusScoreDetail ScoreDetail { get; set; }
}

/// <summary>
/// スコア計算の詳細情報
/// </summary>
public class FocusScoreDetail
{
    /// <summary>
    /// 優先度スコア
    /// </summary>
    public decimal PriorityScore { get; set; }

    /// <summary>
    /// 期限スコア
    /// </summary>
    public decimal DeadlineScore { get; set; }

    /// <summary>
    /// 後続タスク影響スコア
    /// </summary>
    public decimal SuccessorImpactScore { get; set; }

    /// <summary>
    /// 優先度の重み
    /// </summary>
    public decimal PriorityWeight { get; set; }

    /// <summary>
    /// 期限の重み
    /// </summary>
    public decimal DeadlineWeight { get; set; }

    /// <summary>
    /// 後続タスク影響の重み
    /// </summary>
    public decimal SuccessorImpactWeight { get; set; }

    /// <summary>
    /// スコア計算の説明
    /// </summary>
    public string Explanation { get; set; } = string.Empty;
}

/// <summary>
/// やることリスト詳細取得結果（API用）
/// </summary>
public class FocusTaskDetailResult
{
    /// <summary>
    /// 今すぐ取り組むべきタスク（着手可能、スコア上位）
    /// </summary>
    public List<FocusTaskDetailInfo> FocusTasks { get; set; } = [];

    /// <summary>
    /// 待機中タスク（先行タスク未完了）
    /// </summary>
    public List<FocusTaskDetailInfo> WaitingTasks { get; set; } = [];

    /// <summary>
    /// 対象タスクの総数
    /// </summary>
    public int TotalTaskCount { get; set; }
}