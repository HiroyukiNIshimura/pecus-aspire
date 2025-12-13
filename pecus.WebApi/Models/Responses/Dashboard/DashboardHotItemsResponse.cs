using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.Dashboard;

/// <summary>
/// ホットアイテム統計レスポンス
/// 直近で作業が活発なアイテムのランキング
/// </summary>
public class DashboardHotItemsResponse
{
    /// <summary>
    /// 集計期間（"24h" または "1week"）
    /// </summary>
    [Required]
    public required string Period { get; set; }

    /// <summary>
    /// ホットアイテムリスト（アクティビティ数の多い順）
    /// </summary>
    [Required]
    public required List<HotItemEntry> Items { get; set; }
}

/// <summary>
/// ホットアイテムのエントリ
/// </summary>
public class HotItemEntry
{
    /// <summary>
    /// アイテムID
    /// </summary>
    [Required]
    public required int ItemId { get; set; }

    /// <summary>
    /// アイテムコード（URL用）
    /// </summary>
    [Required]
    public required string ItemCode { get; set; }

    /// <summary>
    /// アイテム件名
    /// </summary>
    [Required]
    public required string ItemSubject { get; set; }

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
    /// 直近のアクティビティ数
    /// </summary>
    [Required]
    public required int ActivityCount { get; set; }

    /// <summary>
    /// 最終アクティビティ日時（UTC）
    /// </summary>
    [Required]
    public required DateTimeOffset LastActivityAt { get; set; }
}
