namespace Pecus.Libs.Statistics;

/// <summary>
/// 統計計算用の日付ユーティリティ
/// DashboardStatisticsService の実装を基準とする
/// </summary>
public static class StatisticsDateHelper
{
    /// <summary>
    /// 今日の開始時刻（00:00:00 UTC）を取得
    /// 期限切れ判定の基準として使用
    /// </summary>
    public static DateTimeOffset GetTodayStart()
    {
        var now = DateTimeOffset.UtcNow;
        return new DateTimeOffset(now.Date, TimeSpan.Zero);
    }

    /// <summary>
    /// 週の開始日（月曜日の00:00:00 UTC）を取得
    /// </summary>
    /// <param name="date">基準日</param>
    /// <returns>その週の月曜日</returns>
    public static DateTimeOffset GetStartOfWeek(DateTimeOffset date)
    {
        var diff = (7 + (date.DayOfWeek - DayOfWeek.Monday)) % 7;
        return new DateTimeOffset(date.AddDays(-diff).Date, TimeSpan.Zero);
    }

    /// <summary>
    /// 週の終了日時（日曜日の23:59:59.9999999 UTC）を取得
    /// </summary>
    /// <param name="date">基準日</param>
    /// <returns>その週の日曜日の終わり</returns>
    public static DateTimeOffset GetEndOfWeek(DateTimeOffset date)
    {
        var startOfWeek = GetStartOfWeek(date);
        return startOfWeek.AddDays(7).AddTicks(-1);
    }

    /// <summary>
    /// 今週の開始日（月曜日）を取得
    /// </summary>
    public static DateTimeOffset GetThisWeekStart()
    {
        return GetStartOfWeek(GetTodayStart());
    }

    /// <summary>
    /// 今週の終了日時を取得
    /// </summary>
    public static DateTimeOffset GetThisWeekEnd()
    {
        return GetEndOfWeek(GetTodayStart());
    }

    /// <summary>
    /// N日前の日時を取得
    /// </summary>
    /// <param name="days">日数</param>
    /// <returns>N日前の日時</returns>
    public static DateTimeOffset GetDaysAgo(int days)
    {
        return DateTimeOffset.UtcNow.AddDays(-days);
    }

    /// <summary>
    /// ISO週番号を取得
    /// </summary>
    /// <param name="date">対象日</param>
    /// <returns>ISO週番号</returns>
    public static int GetIsoWeekNumber(DateTimeOffset date)
    {
        var cal = System.Globalization.CultureInfo.InvariantCulture.Calendar;
        return cal.GetWeekOfYear(
            date.DateTime,
            System.Globalization.CalendarWeekRule.FirstFourDayWeek,
            DayOfWeek.Monday);
    }

    /// <summary>
    /// DateOnly を DateTimeOffset（UTC 00:00:00）に変換
    /// </summary>
    /// <param name="date">変換元の DateOnly</param>
    /// <returns>UTC 00:00:00 の DateTimeOffset</returns>
    public static DateTimeOffset ToDateTimeOffsetStart(DateOnly date)
    {
        return new DateTimeOffset(date.ToDateTime(TimeOnly.MinValue), TimeSpan.Zero);
    }

    /// <summary>
    /// DateOnly を DateTimeOffset（UTC 23:59:59.9999999）に変換
    /// </summary>
    /// <param name="date">変換元の DateOnly</param>
    /// <returns>UTC 23:59:59.9999999 の DateTimeOffset</returns>
    public static DateTimeOffset ToDateTimeOffsetEnd(DateOnly date)
    {
        return new DateTimeOffset(date.ToDateTime(TimeOnly.MaxValue), TimeSpan.Zero);
    }

    /// <summary>
    /// 前週の月曜～日曜の日付範囲を計算（月曜起点）
    /// </summary>
    /// <param name="today">基準日（DateOnly）</param>
    /// <returns>前週の月曜日と日曜日</returns>
    public static (DateOnly WeekStart, DateOnly WeekEnd) GetLastWeekDateRange(DateOnly today)
    {
        var dayOfWeek = (int)today.DayOfWeek;
        if (dayOfWeek == 0) dayOfWeek = 7;

        var thisWeekMonday = today.AddDays(-(dayOfWeek - 1));
        var lastWeekMonday = thisWeekMonday.AddDays(-7);
        var lastWeekSunday = lastWeekMonday.AddDays(6);

        return (lastWeekMonday, lastWeekSunday);
    }

    /// <summary>
    /// 来週の月曜～日曜の日付範囲を計算（月曜起点）
    /// </summary>
    /// <param name="today">基準日（DateOnly）</param>
    /// <returns>来週の月曜日と日曜日</returns>
    public static (DateOnly WeekStart, DateOnly WeekEnd) GetNextWeekDateRange(DateOnly today)
    {
        var dayOfWeek = (int)today.DayOfWeek;
        if (dayOfWeek == 0) dayOfWeek = 7;

        var thisWeekMonday = today.AddDays(-(dayOfWeek - 1));
        var nextWeekMonday = thisWeekMonday.AddDays(7);
        var nextWeekSunday = nextWeekMonday.AddDays(6);

        return (nextWeekMonday, nextWeekSunday);
    }
}