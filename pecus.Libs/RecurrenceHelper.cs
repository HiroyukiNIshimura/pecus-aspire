using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;

namespace Pecus.Libs;

/// <summary>
/// オカレンス情報（インデックス付き）
/// </summary>
public record OccurrenceInfo(int Index, DateTimeOffset StartAt);

/// <summary>
/// 繰り返しイベントの展開ロジックを提供するヘルパークラス
/// </summary>
public static class RecurrenceHelper
{
    /// <summary>
    /// 繰り返しイベントを指定期間内で展開し、各オカレンスの開始日時とインデックスを返す
    /// </summary>
    /// <param name="agenda">展開対象のアジェンダ</param>
    /// <param name="rangeStart">期間開始</param>
    /// <param name="rangeEnd">期間終了</param>
    /// <param name="maxOccurrences">最大オカレンス数（安全策）</param>
    /// <returns>各オカレンスの情報リスト</returns>
    public static List<OccurrenceInfo> ExpandOccurrencesWithIndex(
        Agenda agenda,
        DateTimeOffset rangeStart,
        DateTimeOffset rangeEnd,
        int maxOccurrences = 365)
    {
        var occurrences = new List<OccurrenceInfo>();

        // 単発イベントまたは繰り返しなしの場合
        if (agenda.RecurrenceType == null || agenda.RecurrenceType == RecurrenceType.None)
        {
            if (agenda.StartAt < rangeEnd && agenda.EndAt > rangeStart)
            {
                occurrences.Add(new OccurrenceInfo(0, agenda.StartAt));
            }
            return occurrences;
        }

        var current = agenda.StartAt;
        var interval = Math.Max(1, agenda.RecurrenceInterval);
        var index = 0;

        // 繰り返し終了条件
        var endDate = GetRecurrenceEndDate(agenda);

        while (index < maxOccurrences)
        {
            // 終了条件チェック
            if (endDate.HasValue && DateOnly.FromDateTime(current.UtcDateTime) > endDate.Value)
                break;

            if (current >= rangeEnd)
                break;

            // 範囲内に入っていれば追加
            if (current >= rangeStart || agenda.EndAt.Add(current - agenda.StartAt) > rangeStart)
            {
                occurrences.Add(new OccurrenceInfo(index, current));
            }

            // 次のオカレンスを計算
            current = GetNextOccurrence(agenda, current, interval);
            index++;

            // 回数制限チェック
            if (agenda.RecurrenceCount.HasValue && index >= agenda.RecurrenceCount.Value)
                break;
        }

        return occurrences;
    }

    /// <summary>
    /// 繰り返しイベントを指定期間内で展開し、各オカレンスの開始日時を返す（後方互換性用）
    /// </summary>
    /// <param name="agenda">展開対象のアジェンダ</param>
    /// <param name="rangeStart">期間開始</param>
    /// <param name="rangeEnd">期間終了</param>
    /// <param name="maxOccurrences">最大オカレンス数（安全策）</param>
    /// <returns>各オカレンスの開始日時リスト</returns>
    public static List<DateTimeOffset> ExpandOccurrences(
        Agenda agenda,
        DateTimeOffset rangeStart,
        DateTimeOffset rangeEnd,
        int maxOccurrences = 365)
    {
        return ExpandOccurrencesWithIndex(agenda, rangeStart, rangeEnd, maxOccurrences)
            .Select(o => o.StartAt)
            .ToList();
    }

    /// <summary>
    /// 繰り返し終了日を取得
    /// </summary>
    private static DateOnly? GetRecurrenceEndDate(Agenda agenda)
    {
        if (agenda.RecurrenceEndDate.HasValue)
            return agenda.RecurrenceEndDate.Value;

        // 回数指定の場合は終了日を計算しない（ループ内でチェック）
        if (agenda.RecurrenceCount.HasValue)
            return null;

        // 無期限の場合は2年後を上限とする（安全策）
        return DateOnly.FromDateTime(agenda.StartAt.UtcDateTime.AddYears(2));
    }

    /// <summary>
    /// 次のオカレンスの日時を計算
    /// </summary>
    private static DateTimeOffset GetNextOccurrence(Agenda agenda, DateTimeOffset current, int interval)
    {
        return agenda.RecurrenceType switch
        {
            RecurrenceType.Daily => current.AddDays(interval),
            RecurrenceType.Weekly => current.AddDays(7 * interval),
            RecurrenceType.Biweekly => current.AddDays(14),
            RecurrenceType.MonthlyByDate => AddMonthsByDate(current, interval),
            RecurrenceType.MonthlyByWeekday => AddMonthsByWeekday(current, interval, agenda.RecurrenceWeekOfMonth),
            RecurrenceType.Yearly => current.AddYears(interval),
            _ => current.AddDays(interval)
        };
    }

    /// <summary>
    /// 月次（日付指定）: 毎月同じ日付
    /// </summary>
    private static DateTimeOffset AddMonthsByDate(DateTimeOffset current, int interval)
    {
        var targetDate = current.AddMonths(interval);
        var originalDay = current.Day;

        // 月末日を超える場合は月末に調整
        var daysInMonth = DateTime.DaysInMonth(targetDate.Year, targetDate.Month);
        var adjustedDay = Math.Min(originalDay, daysInMonth);

        return new DateTimeOffset(
            targetDate.Year, targetDate.Month, adjustedDay,
            current.Hour, current.Minute, current.Second,
            current.Offset);
    }

    /// <summary>
    /// 月次（曜日指定）: 毎月第N週の同じ曜日
    /// </summary>
    private static DateTimeOffset AddMonthsByWeekday(DateTimeOffset current, int interval, int? weekOfMonth)
    {
        var targetMonth = current.AddMonths(interval);
        var dayOfWeek = current.DayOfWeek;
        var week = weekOfMonth ?? GetWeekOfMonth(current);

        // 対象月の第1日を取得
        var firstDayOfMonth = new DateTimeOffset(
            targetMonth.Year, targetMonth.Month, 1,
            current.Hour, current.Minute, current.Second,
            current.Offset);

        // 対象曜日の最初の日を見つける
        var daysUntilTargetDay = ((int)dayOfWeek - (int)firstDayOfMonth.DayOfWeek + 7) % 7;
        var firstTargetDayOfMonth = firstDayOfMonth.AddDays(daysUntilTargetDay);

        // 第N週に移動
        DateTimeOffset result;
        if (week == 5) // 最終週
        {
            result = GetLastWeekdayOfMonth(targetMonth.Year, targetMonth.Month, dayOfWeek, current);
        }
        else
        {
            result = firstTargetDayOfMonth.AddDays(7 * (week - 1));

            // 月をまたいでしまった場合は前の週に調整
            if (result.Month != targetMonth.Month)
            {
                result = result.AddDays(-7);
            }
        }

        return result;
    }

    /// <summary>
    /// 月内の何週目かを計算
    /// </summary>
    private static int GetWeekOfMonth(DateTimeOffset date)
    {
        var firstDayOfMonth = new DateTimeOffset(date.Year, date.Month, 1, 0, 0, 0, date.Offset);
        var daysUntilTargetDay = ((int)date.DayOfWeek - (int)firstDayOfMonth.DayOfWeek + 7) % 7;
        var firstTargetDayOfMonth = firstDayOfMonth.AddDays(daysUntilTargetDay);

        return ((date.Day - firstTargetDayOfMonth.Day) / 7) + 1;
    }

    /// <summary>
    /// 月の最終曜日を取得
    /// </summary>
    private static DateTimeOffset GetLastWeekdayOfMonth(int year, int month, DayOfWeek dayOfWeek, DateTimeOffset timeTemplate)
    {
        var daysInMonth = DateTime.DaysInMonth(year, month);
        var lastDayOfMonth = new DateTimeOffset(
            year, month, daysInMonth,
            timeTemplate.Hour, timeTemplate.Minute, timeTemplate.Second,
            timeTemplate.Offset);

        var daysToSubtract = ((int)lastDayOfMonth.DayOfWeek - (int)dayOfWeek + 7) % 7;
        return lastDayOfMonth.AddDays(-daysToSubtract);
    }

    /// <summary>
    /// 繰り返しタイプのバリデーション
    /// </summary>
    public static (bool IsValid, string? ErrorMessage) ValidateRecurrence(
        RecurrenceType? recurrenceType,
        int interval,
        int? weekOfMonth,
        DateOnly? endDate,
        int? count,
        DateTimeOffset startAt)
    {
        if (recurrenceType == null || recurrenceType == RecurrenceType.None)
            return (true, null);

        if (interval < 1 || interval > 99)
            return (false, "繰り返し間隔は1〜99の範囲で指定してください。");

        if (recurrenceType == RecurrenceType.MonthlyByWeekday)
        {
            if (weekOfMonth.HasValue && (weekOfMonth < 1 || weekOfMonth > 5))
                return (false, "週番号は1〜5の範囲で指定してください（5=最終週）。");
        }

        if (endDate.HasValue && count.HasValue)
            return (false, "終了日と回数は同時に指定できません。");

        if (endDate.HasValue && endDate.Value < DateOnly.FromDateTime(startAt.UtcDateTime))
            return (false, "終了日は開始日以降を指定してください。");

        if (count.HasValue && (count < 1 || count > 999))
            return (false, "繰り返し回数は1〜999の範囲で指定してください。");

        return (true, null);
    }

    /// <summary>
    /// 繰り返しの説明文を生成
    /// </summary>
    public static string GetRecurrenceDescription(Agenda agenda)
    {
        if (agenda.RecurrenceType == null || agenda.RecurrenceType == RecurrenceType.None)
            return string.Empty;

        var interval = agenda.RecurrenceInterval;
        var dayOfWeek = agenda.StartAt.DayOfWeek;
        var dayOfWeekJp = GetJapaneseDayOfWeek(dayOfWeek);

        return agenda.RecurrenceType switch
        {
            RecurrenceType.Daily when interval == 1 => "毎日",
            RecurrenceType.Daily => $"{interval}日ごと",
            RecurrenceType.Weekly when interval == 1 => $"毎週{dayOfWeekJp}曜日",
            RecurrenceType.Weekly => $"{interval}週間ごとの{dayOfWeekJp}曜日",
            RecurrenceType.Biweekly => $"隔週{dayOfWeekJp}曜日",
            RecurrenceType.MonthlyByDate when interval == 1 => $"毎月{agenda.StartAt.Day}日",
            RecurrenceType.MonthlyByDate => $"{interval}ヶ月ごとの{agenda.StartAt.Day}日",
            RecurrenceType.MonthlyByWeekday when interval == 1 => $"毎月第{GetWeekNumber(agenda)}{dayOfWeekJp}曜日",
            RecurrenceType.MonthlyByWeekday => $"{interval}ヶ月ごとの第{GetWeekNumber(agenda)}{dayOfWeekJp}曜日",
            RecurrenceType.Yearly when interval == 1 => $"毎年{agenda.StartAt.Month}月{agenda.StartAt.Day}日",
            RecurrenceType.Yearly => $"{interval}年ごと",
            _ => string.Empty
        };
    }

    private static string GetJapaneseDayOfWeek(DayOfWeek dayOfWeek) => dayOfWeek switch
    {
        DayOfWeek.Sunday => "日",
        DayOfWeek.Monday => "月",
        DayOfWeek.Tuesday => "火",
        DayOfWeek.Wednesday => "水",
        DayOfWeek.Thursday => "木",
        DayOfWeek.Friday => "金",
        DayOfWeek.Saturday => "土",
        _ => string.Empty
    };

    private static string GetWeekNumber(Agenda agenda)
    {
        var week = agenda.RecurrenceWeekOfMonth ?? GetWeekOfMonth(agenda.StartAt);
        return week == 5 ? "最終" : week.ToString();
    }
}
