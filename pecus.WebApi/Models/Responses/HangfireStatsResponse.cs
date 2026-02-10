namespace Pecus.Models.Responses;

/// <summary>
///     Hangfireの統計情報レスポンス
/// </summary>
public record HangfireStatsResponse
{
    /// <summary>
    ///     待機中ジョブ数
    /// </summary>
    public long Enqueued { get; init; }

    /// <summary>
    ///     失敗ジョブ数
    /// </summary>
    public long Failed { get; init; }

    /// <summary>
    ///     処理中ジョブ数
    /// </summary>
    public long Processing { get; init; }

    /// <summary>
    ///     スケジュール済みジョブ数
    /// </summary>
    public long Scheduled { get; init; }

    /// <summary>
    ///     成功ジョブ数
    /// </summary>
    public long Succeeded { get; init; }

    /// <summary>
    ///     削除済みジョブ数
    /// </summary>
    public long Deleted { get; init; }

    /// <summary>
    ///     再試行ジョブ数
    /// </summary>
    public long Recurring { get; init; }

    /// <summary>
    ///  サーバー数
    /// </summary>
    public int ServerCount { get; init; }

    /// <summary>
    ///   ワーカー数
    /// </summary>
    public int WorkerCount { get; init; }
}