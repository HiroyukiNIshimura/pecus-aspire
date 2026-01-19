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

    // --- ドキュメントモード用の拡張統計 ---

    /// <summary>長期未更新アイテム数（30日以上未更新）</summary>
    public int StaleCount { get; init; }

    /// <summary>今週更新されたアイテム数</summary>
    public int UpdatedThisWeekCount { get; init; }

    /// <summary>今週作成されたアイテム数</summary>
    public int CreatedThisWeekCount { get; init; }

    /// <summary>公開アイテムの平均経過日数（最終更新からの日数）</summary>
    public double AverageItemAgeDays { get; init; }

    /// <summary>ユニーク編集者数（直近30日間）</summary>
    public int UniqueContributorCount { get; init; }
}