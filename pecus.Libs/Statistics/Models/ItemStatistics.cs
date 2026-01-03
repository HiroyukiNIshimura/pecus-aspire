namespace Pecus.Libs.Statistics.Models;

/// <summary>
/// アイテム統計データ
/// DashboardStatisticsService の GetItemSummaryAsync を基準とした統一モデル
/// </summary>
public record ItemStatistics
{
    /// <summary>アイテム総数</summary>
    public int TotalCount { get; init; }

    /// <summary>公開アイテム数（公開済み・未アーカイブ）</summary>
    public int PublishedCount { get; init; }

    /// <summary>下書きアイテム数</summary>
    public int DraftCount { get; init; }

    /// <summary>アーカイブ済みアイテム数</summary>
    public int ArchivedCount { get; init; }
}