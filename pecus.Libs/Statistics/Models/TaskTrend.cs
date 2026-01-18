namespace Pecus.Libs.Statistics.Models;

/// <summary>
/// 週単位のタスク推移データ
/// </summary>
public record WeeklyTrend
{
    /// <summary>週の開始日（月曜日）</summary>
    public DateTimeOffset WeekStart { get; init; }

    /// <summary>表示用ラベル（例: "1/6〜1/12"）</summary>
    public string Label { get; init; } = string.Empty;

    /// <summary>その週に作成されたタスク数</summary>
    public int CreatedCount { get; init; }

    /// <summary>その週に完了したタスク数</summary>
    public int CompletedCount { get; init; }

    /// <summary>差分（完了 - 作成）。正なら消化、負なら蓄積</summary>
    public int NetChange => CompletedCount - CreatedCount;
}

/// <summary>
/// 週次トレンドデータ（複数週分）
/// </summary>
public record TaskTrend
{
    /// <summary>週次データのリスト（古い順）</summary>
    public IReadOnlyList<WeeklyTrend> Weeks { get; init; } = [];

    /// <summary>期間全体の作成タスク合計</summary>
    public int TotalCreated => Weeks.Sum(w => w.CreatedCount);

    /// <summary>期間全体の完了タスク合計</summary>
    public int TotalCompleted => Weeks.Sum(w => w.CompletedCount);

    /// <summary>期間全体の差分（正=消化傾向、負=蓄積傾向）</summary>
    public int NetChange => TotalCompleted - TotalCreated;

    /// <summary>AI向けの要約テキストを生成</summary>
    public string ToSummary()
    {
        if (Weeks.Count == 0)
        {
            return "トレンドデータなし";
        }

        var lines = Weeks.Select(w =>
            $"  - {w.Label}: 新規{w.CreatedCount}件, 完了{w.CompletedCount}件 ({(w.NetChange >= 0 ? "+" : "")}{w.NetChange})");

        var trend = NetChange switch
        {
            > 0 => "消化が進んでいる",
            < 0 => "タスクが蓄積している",
            _ => "均衡状態",
        };

        return $"""
            週次推移（{Weeks.Count}週間）:
            {string.Join("\n", lines)}
              → 全体傾向: {trend}（差分: {(NetChange >= 0 ? "+" : "")}{NetChange}件）
            """;
    }
}
