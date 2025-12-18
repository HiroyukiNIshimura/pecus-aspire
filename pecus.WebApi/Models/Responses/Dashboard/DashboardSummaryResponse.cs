using Pecus.Libs.DB.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.Dashboard;

/// <summary>
/// ダッシュボード統計サマリレスポンス
/// タスクとアイテムの現在状態を集計したサマリ情報
/// </summary>
public class DashboardSummaryResponse
{
    /// <summary>
    /// タスク統計
    /// </summary>
    [Required]
    public required DashboardTaskSummary TaskSummary { get; set; }

    /// <summary>
    /// アイテム統計
    /// </summary>
    [Required]
    public required DashboardItemSummary ItemSummary { get; set; }

    /// <summary>
    /// ワークスペース統計
    /// </summary>
    [Required]
    public required DashboardWorkspaceSummary WorkspaceSummary { get; set; }
}

/// <summary>
/// タスクサマリ（WorkspaceTask ベース）
/// </summary>
public class DashboardTaskSummary
{
    /// <summary>
    /// 進行中タスク数（未完了・未破棄）
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

    /// <summary>
    /// 期限切れタスク数（期限超過の未完了タスク）
    /// </summary>
    [Required]
    public required int OverdueCount { get; set; }

    /// <summary>
    /// 今週期限タスク数（今週中に期限の未完了タスク）
    /// </summary>
    [Required]
    public required int DueThisWeekCount { get; set; }

    /// <summary>
    /// 未アサインタスク数（担当者未設定の未完了・未破棄タスク）
    /// </summary>
    [Required]
    public required int UnassignedCount { get; set; }

    /// <summary>
    /// 総タスク数
    /// </summary>
    [Required]
    public required int TotalCount { get; set; }
}

/// <summary>
/// アイテムサマリ（WorkspaceItem ベース）
/// </summary>
public class DashboardItemSummary
{
    /// <summary>
    /// 公開アイテム数（公開済み・未アーカイブ）
    /// </summary>
    [Required]
    public required int PublishedCount { get; set; }

    /// <summary>
    /// 下書きアイテム数
    /// </summary>
    [Required]
    public required int DraftCount { get; set; }

    /// <summary>
    /// アーカイブ済みアイテム数
    /// </summary>
    [Required]
    public required int ArchivedCount { get; set; }

    /// <summary>
    /// 総アイテム数
    /// </summary>
    [Required]
    public required int TotalCount { get; set; }
}

/// <summary>
/// ワークスペースサマリ
/// </summary>
public class DashboardWorkspaceSummary
{
    /// <summary>
    /// ワークスペース総数（アクティブなワークスペース）
    /// </summary>
    [Required]
    public required int TotalCount { get; set; }

    /// <summary>
    /// ドキュメントモードのワークスペース数
    /// </summary>
    [Required]
    public required int DocumentModeCount { get; set; }
}

/// <summary>
/// 優先度別タスク数レスポンス
/// </summary>
public class DashboardTasksByPriorityResponse
{
    /// <summary>
    /// 優先度別の内訳
    /// </summary>
    [Required]
    public required List<PriorityTaskCount> Priorities { get; set; }

    /// <summary>
    /// 合計（進行中タスクのみ）
    /// </summary>
    [Required]
    public required int TotalCount { get; set; }
}

/// <summary>
/// 優先度ごとのタスク数
/// </summary>
public class PriorityTaskCount
{
    /// <summary>
    /// 優先度（null の場合は Medium として扱う）
    /// </summary>
    public TaskPriority? Priority { get; set; }

    /// <summary>
    /// タスク数
    /// </summary>
    [Required]
    public required int Count { get; set; }
}