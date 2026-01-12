using Microsoft.Extensions.Logging;
using Pecus.Libs.DB;

namespace Pecus.Libs.Achievements;

/// <summary>
/// 実績判定ロジックの基底クラス
/// </summary>
public abstract class AchievementStrategyBase : IAchievementStrategy
{
    /// <summary>
    /// 1回の評価で返す最大ユーザー数。
    /// 対象外になったユーザーは翌日以降のジョブで処理される。
    /// </summary>
    protected const int MaxResultsPerEvaluation = 500;

    /// <summary>
    /// データベースコンテキスト
    /// </summary>
    protected readonly ApplicationDbContext Context;

    /// <summary>
    /// ロガー
    /// </summary>
    protected readonly ILogger Logger;

    /// <summary>
    /// コンストラクタ
    /// </summary>
    /// <param name="context">データベースコンテキスト</param>
    /// <param name="logger">ロガー</param>
    protected AchievementStrategyBase(ApplicationDbContext context, ILogger logger)
    {
        Context = context;
        Logger = logger;
    }

    /// <inheritdoc />
    public abstract string AchievementCode { get; }

    /// <inheritdoc />
    public abstract Task<IEnumerable<int>> EvaluateAsync(
        int organizationId,
        DateTimeOffset evaluationDate,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 組織のタイムゾーンを考慮したローカル時刻を取得
    /// </summary>
    /// <param name="utcTime">UTC時刻</param>
    /// <param name="timeZoneId">IANAタイムゾーンID（例: Asia/Tokyo）</param>
    /// <returns>ローカル時刻</returns>
    protected static DateTimeOffset ConvertToLocalTime(DateTimeOffset utcTime, string timeZoneId)
    {
        try
        {
            var timeZone = TimeZoneInfo.FindSystemTimeZoneById(timeZoneId);
            return TimeZoneInfo.ConvertTime(utcTime, timeZone);
        }
        catch (TimeZoneNotFoundException)
        {
            return utcTime;
        }
    }

    /// <summary>
    /// 指定時刻がタイムゾーンを考慮した時間帯内かどうかを判定
    /// </summary>
    /// <param name="utcTime">UTC時刻</param>
    /// <param name="timeZoneId">IANAタイムゾーンID</param>
    /// <param name="startHour">開始時（0-23）</param>
    /// <param name="endHour">終了時（0-23）</param>
    /// <returns>時間帯内であればtrue</returns>
    protected static bool IsWithinTimeRange(DateTimeOffset utcTime, string timeZoneId, int startHour, int endHour)
    {
        var localTime = ConvertToLocalTime(utcTime, timeZoneId);
        var hour = localTime.Hour;

        if (startHour <= endHour)
        {
            return hour >= startHour && hour < endHour;
        }
        else
        {
            // 深夜をまたぐケース（例: 22:00-2:00）
            return hour >= startHour || hour < endHour;
        }
    }
}
