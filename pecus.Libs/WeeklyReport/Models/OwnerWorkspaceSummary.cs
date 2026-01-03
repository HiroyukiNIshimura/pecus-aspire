namespace Pecus.Libs.WeeklyReport.Models;

/// <summary>
/// オーナー向け: ワークスペース状況のサマリ（責任アイテムをネスト）
/// </summary>
public class OwnerWorkspaceSummary
{
    /// <summary>
    /// ワークスペースID
    /// </summary>
    public int WorkspaceId { get; set; }

    /// <summary>
    /// ワークスペース名
    /// </summary>
    public string WorkspaceName { get; set; } = string.Empty;

    /// <summary>
    /// 進行中のタスク数（未完了かつ未破棄）
    /// </summary>
    public int InProgressCount { get; set; }

    /// <summary>
    /// 今週完了したタスク数
    /// </summary>
    public int CompletedThisWeekCount { get; set; }

    /// <summary>
    /// 期限切れタスク数
    /// </summary>
    public int OverdueCount { get; set; }

    /// <summary>
    /// 来週期限のタスク数
    /// </summary>
    public int DueNextWeekCount { get; set; }

    /// <summary>
    /// このWSでオーナーがコミッターになっている責任アイテム一覧
    /// </summary>
    public List<CommitterItemSummary> CommitterItems { get; set; } = [];

    /// <summary>
    /// 責任アイテムがあるか
    /// </summary>
    public bool HasCommitterItems => CommitterItems.Count > 0;
}