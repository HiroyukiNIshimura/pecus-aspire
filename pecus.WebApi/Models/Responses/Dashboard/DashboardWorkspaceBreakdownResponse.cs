using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.Dashboard;

/// <summary>
/// ワークスペース別統計レスポンス
/// </summary>
public class DashboardWorkspaceBreakdownResponse
{
    /// <summary>
    /// ワークスペース別の統計リスト
    /// </summary>
    [Required]
    public required List<DashboardWorkspaceStatistics> Workspaces { get; set; }
}

/// <summary>
/// ワークスペースごとの統計
/// </summary>
public class DashboardWorkspaceStatistics
{
    /// <summary>
    /// ワークスペースID
    /// </summary>
    [Required]
    public required int WorkspaceId { get; set; }

    /// <summary>
    /// ワークスペースコード
    /// </summary>
    [Required]
    public required string WorkspaceCode { get; set; }

    /// <summary>
    /// ワークスペース名
    /// </summary>
    [Required]
    public required string WorkspaceName { get; set; }

    /// <summary>
    /// ジャンルアイコン
    /// </summary>
    public string? GenreIcon { get; set; }

    /// <summary>
    /// 進行中タスク数
    /// </summary>
    [Required]
    public required int InProgressCount { get; set; }

    /// <summary>
    /// 完了タスク数
    /// </summary>
    [Required]
    public required int CompletedCount { get; set; }

    /// <summary>
    /// 期限切れタスク数
    /// </summary>
    [Required]
    public required int OverdueCount { get; set; }

    /// <summary>
    /// アイテム数
    /// </summary>
    [Required]
    public required int ItemCount { get; set; }

    /// <summary>
    /// メンバー数
    /// </summary>
    [Required]
    public required int MemberCount { get; set; }
}