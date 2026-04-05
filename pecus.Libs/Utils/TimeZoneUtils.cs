namespace Pecus.Libs.Utils;

/// <summary>
/// タイムゾーン関連のユーティリティ
/// </summary>
public static class TimeZoneUtils
{
    /// <summary>
    /// 既定のタイムゾーンID
    /// </summary>
    public const string DefaultTimeZoneId = "Asia/Tokyo";

    /// <summary>
    /// ユーザー指定のタイムゾーンを解決し、失敗時は既定タイムゾーン（最終的にUTC）を返す
    /// </summary>
    public static TimeZoneInfo ResolveTimeZoneOrDefault(
        string? userTimeZone,
        string defaultTimeZoneId = DefaultTimeZoneId)
    {
        if (TryResolveTimeZone(userTimeZone, out var timeZone))
        {
            return timeZone;
        }

        if (TryResolveTimeZone(defaultTimeZoneId, out timeZone))
        {
            return timeZone;
        }

        return TimeZoneInfo.Utc;
    }

    /// <summary>
    /// タイムゾーンID（IANA / Windows）を解決する
    /// </summary>
    public static bool TryResolveTimeZone(string? timeZoneId, out TimeZoneInfo timeZone)
    {
        timeZone = TimeZoneInfo.Utc;

        if (string.IsNullOrWhiteSpace(timeZoneId))
        {
            return false;
        }

        var trimmed = timeZoneId.Trim();

        if (TryFindById(trimmed, out timeZone))
        {
            return true;
        }

        if (TimeZoneInfo.TryConvertIanaIdToWindowsId(trimmed, out var windowsId)
            && !string.IsNullOrWhiteSpace(windowsId)
            && TryFindById(windowsId, out timeZone))
        {
            return true;
        }

        if (TimeZoneInfo.TryConvertWindowsIdToIanaId(trimmed, out var ianaId)
            && !string.IsNullOrWhiteSpace(ianaId)
            && TryFindById(ianaId, out timeZone))
        {
            return true;
        }

        return false;
    }

    /// <summary>
    /// UTC日時をユーザータイムゾーン日時に変換する
    /// </summary>
    public static DateTimeOffset ConvertUtcToUserTime(
        DateTimeOffset utcDateTime,
        string? userTimeZone,
        string defaultTimeZoneId = DefaultTimeZoneId)
    {
        var timeZone = ResolveTimeZoneOrDefault(userTimeZone, defaultTimeZoneId);
        return TimeZoneInfo.ConvertTime(utcDateTime, timeZone);
    }

    /// <summary>
    /// UTC日時をユーザータイムゾーン日時に変換する（nullable対応）
    /// </summary>
    public static DateTimeOffset? ConvertUtcToUserTime(
        DateTimeOffset? utcDateTime,
        string? userTimeZone,
        string defaultTimeZoneId = DefaultTimeZoneId)
    {
        if (!utcDateTime.HasValue)
        {
            return null;
        }

        return ConvertUtcToUserTime(utcDateTime.Value, userTimeZone, defaultTimeZoneId);
    }

    private static bool TryFindById(string timeZoneId, out TimeZoneInfo timeZone)
    {
        try
        {
            timeZone = TimeZoneInfo.FindSystemTimeZoneById(timeZoneId);
            return true;
        }
        catch (TimeZoneNotFoundException)
        {
            timeZone = TimeZoneInfo.Utc;
            return false;
        }
        catch (InvalidTimeZoneException)
        {
            timeZone = TimeZoneInfo.Utc;
            return false;
        }
    }
}