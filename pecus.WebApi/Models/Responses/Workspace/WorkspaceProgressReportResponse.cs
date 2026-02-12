using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Pecus.Models.Responses.Workspace;

/// <summary>
/// ワークスペース進捗レポートレスポンス
/// </summary>
public class WorkspaceProgressReportResponse
{
    /// <summary>
    /// ワークスペース情報
    /// </summary>
    [Required]
    public required ProgressReportWorkspaceInfo Workspace { get; set; }

    /// <summary>
    /// レポート期間
    /// </summary>
    [Required]
    public required ProgressReportPeriod Period { get; set; }

    /// <summary>
    /// レポート生成日時（日本時間 yyyy-MM-dd HH:mm形式）
    /// </summary>
    [Required]
    public required string GeneratedAt { get; set; }

    /// <summary>
    /// サマリー情報
    /// </summary>
    [Required]
    public required ProgressReportSummary Summary { get; set; }

    /// <summary>
    /// アイテム一覧
    /// </summary>
    [Required]
    public required List<ProgressReportItem> Items { get; set; }
}

/// <summary>
/// ワークスペース情報
/// </summary>
public class ProgressReportWorkspaceInfo
{
    /// <summary>
    /// ワークスペースコード
    /// </summary>
    [Required]
    public required string Code { get; set; }

    /// <summary>
    /// ワークスペース名
    /// </summary>
    [Required]
    public required string Name { get; set; }

    /// <summary>
    /// ワークスペースモード
    /// </summary>
    [Required]
    public required string Mode { get; set; }
}

/// <summary>
/// レポート期間
/// </summary>
public class ProgressReportPeriod
{
    /// <summary>
    /// 開始日
    /// </summary>
    [Required]
    public required string From { get; set; }

    /// <summary>
    /// 終了日
    /// </summary>
    [Required]
    public required string To { get; set; }
}

/// <summary>
/// サマリー情報
/// </summary>
public class ProgressReportSummary
{
    /// <summary>
    /// 総アイテム数
    /// </summary>
    public int TotalItems { get; set; }

    /// <summary>
    /// アーカイブ済みアイテム数
    /// </summary>
    public int ArchivedItems { get; set; }

    /// <summary>
    /// 総タスク数
    /// </summary>
    public int TotalTasks { get; set; }

    /// <summary>
    /// ステータス別タスク数
    /// </summary>
    [Required]
    public required ProgressReportTasksByStatus TasksByStatus { get; set; }

    /// <summary>
    /// 完了率（%）
    /// </summary>
    public decimal CompletionRate { get; set; }

    /// <summary>
    /// 総見積もり工数（時間）
    /// </summary>
    public decimal TotalEstimatedHours { get; set; }

    /// <summary>
    /// 総実績工数（時間）
    /// </summary>
    public decimal TotalActualHours { get; set; }
}

/// <summary>
/// ステータス別タスク数
/// </summary>
public class ProgressReportTasksByStatus
{
    /// <summary>
    /// 完了
    /// </summary>
    public int Completed { get; set; }

    /// <summary>
    /// 破棄
    /// </summary>
    public int Discarded { get; set; }

    /// <summary>
    /// 進行中
    /// </summary>
    public int InProgress { get; set; }

    /// <summary>
    /// 未着手
    /// </summary>
    public int Open { get; set; }
}

/// <summary>
/// アイテム情報
/// </summary>
public class ProgressReportItem
{
    /// <summary>
    /// アイテムコード
    /// </summary>
    [Required]
    public required string Code { get; set; }

    /// <summary>
    /// 件名
    /// </summary>
    [Required]
    public required string Subject { get; set; }

    /// <summary>
    /// アーカイブ済みかどうか
    /// </summary>
    public bool IsArchived { get; set; }

    /// <summary>
    /// 下書きかどうか
    /// </summary>
    public bool IsDraft { get; set; }

    /// <summary>
    /// 優先度（Low/Medium/High/Critical、空文字=未設定）
    /// </summary>
    [Required]
    public required string Priority { get; set; }

    /// <summary>
    /// 期限（YYYY-MM-DD形式、空文字=未設定）
    /// </summary>
    [Required]
    public required string DueDate { get; set; }

    /// <summary>
    /// オーナー名（空文字=未設定）
    /// </summary>
    [Required]
    public required string Owner { get; set; }

    /// <summary>
    /// 担当者名（空文字=未設定）
    /// </summary>
    [Required]
    public required string Assignee { get; set; }

    /// <summary>
    /// コミッター名（空文字=未設定）
    /// </summary>
    [Required]
    public required string Committer { get; set; }

    /// <summary>
    /// 作成日時（日本時間 yyyy-MM-dd形式）
    /// </summary>
    [Required]
    public required string CreatedAt { get; set; }

    /// <summary>
    /// 更新日時（日本時間 yyyy-MM-dd形式）
    /// </summary>
    [Required]
    public required string UpdatedAt { get; set; }

    /// <summary>
    /// タスクサマリー
    /// </summary>
    [Required]
    public required ProgressReportItemTaskSummary TaskSummary { get; set; }

    /// <summary>
    /// タスク一覧
    /// </summary>
    [Required]
    public required List<ProgressReportTask> Tasks { get; set; }
}

/// <summary>
/// アイテム単位のタスクサマリー
/// </summary>
public class ProgressReportItemTaskSummary
{
    /// <summary>
    /// 総タスク数
    /// </summary>
    public int Total { get; set; }

    /// <summary>
    /// 完了タスク数
    /// </summary>
    public int Completed { get; set; }

    /// <summary>
    /// 破棄タスク数
    /// </summary>
    public int Discarded { get; set; }

    /// <summary>
    /// 進行中タスク数
    /// </summary>
    public int InProgress { get; set; }

    /// <summary>
    /// 未着手タスク数
    /// </summary>
    public int Open { get; set; }

    /// <summary>
    /// 完了率（%）
    /// </summary>
    public decimal CompletionRate { get; set; }

    /// <summary>
    /// 見積もり工数（時間）
    /// </summary>
    public decimal EstimatedHours { get; set; }

    /// <summary>
    /// 実績工数（時間）
    /// </summary>
    public decimal ActualHours { get; set; }
}

/// <summary>
/// タスク情報
/// </summary>
public class ProgressReportTask
{
    /// <summary>
    /// シーケンス番号
    /// </summary>
    public int Sequence { get; set; }

    /// <summary>
    /// タスク内容
    /// </summary>
    [Required]
    public required string Content { get; set; }

    /// <summary>
    /// ステータス（Open/InProgress/Completed/Discarded）
    /// </summary>
    [Required]
    public required string Status { get; set; }

    /// <summary>
    /// 完了済みかどうか
    /// </summary>
    public bool IsCompleted { get; set; }

    /// <summary>
    /// 破棄済みかどうか
    /// </summary>
    public bool IsDiscarded { get; set; }

    /// <summary>
    /// 優先度（Low/Medium/High/Critical、空文字=未設定）
    /// </summary>
    [Required]
    public required string Priority { get; set; }

    /// <summary>
    /// タスクタイプ名
    /// </summary>
    [Required]
    public required string TaskType { get; set; }

    /// <summary>
    /// タスクタイプアイコン（空文字=未設定）
    /// </summary>
    [Required]
    public required string TaskTypeIcon { get; set; }

    /// <summary>
    /// 担当者名（空文字=未設定）
    /// </summary>
    [Required]
    public required string Assignee { get; set; }

    /// <summary>
    /// 作成者名
    /// </summary>
    [Required]
    public required string CreatedBy { get; set; }

    /// <summary>
    /// 完了者名（空文字=未完了）
    /// </summary>
    [Required]
    public required string CompletedBy { get; set; }

    /// <summary>
    /// 開始日（YYYY-MM-DD形式、空文字=未設定）
    /// </summary>
    [Required]
    public required string StartDate { get; set; }

    /// <summary>
    /// 期限（YYYY-MM-DD形式）
    /// </summary>
    [Required]
    public required string DueDate { get; set; }

    /// <summary>
    /// 完了日時（空文字=未完了）
    /// </summary>
    [Required]
    public required string CompletedAt { get; set; }

    /// <summary>
    /// 破棄日時（空文字=未破棄）
    /// </summary>
    [Required]
    public required string DiscardedAt { get; set; }

    /// <summary>
    /// 破棄理由（空文字=未破棄または理由なし）
    /// </summary>
    [Required]
    public required string DiscardReason { get; set; }

    /// <summary>
    /// 見積もり工数（時間、nullは0として扱う）
    /// </summary>
    public decimal EstimatedHours { get; set; }

    /// <summary>
    /// 実績工数（時間、nullは0として扱う）
    /// </summary>
    public decimal ActualHours { get; set; }

    /// <summary>
    /// 進捗率（0-100）
    /// </summary>
    public int ProgressPercentage { get; set; }

    /// <summary>
    /// 作成日時（日本時間 yyyy-MM-dd形式）
    /// </summary>
    [Required]
    public required string CreatedAt { get; set; }

    /// <summary>
    /// 更新日時（日本時間 yyyy-MM-dd形式）
    /// </summary>
    [Required]
    public required string UpdatedAt { get; set; }
}