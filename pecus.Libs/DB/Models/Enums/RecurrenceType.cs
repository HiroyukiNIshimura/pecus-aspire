namespace Pecus.Libs.DB.Models.Enums;

/// <summary>
/// アジェンダの繰り返しタイプ
/// </summary>
public enum RecurrenceType
{
    /// <summary>
    /// 繰り返しなし（単発）
    /// </summary>
    None = 0,

    /// <summary>
    /// 毎日
    /// </summary>
    Daily = 1,

    /// <summary>
    /// 毎週（開始日の曜日で繰り返し）
    /// </summary>
    Weekly = 2,

    /// <summary>
    /// 隔週（開始日の曜日で繰り返し）
    /// </summary>
    Biweekly = 3,

    /// <summary>
    /// 毎月（日付指定: 毎月15日など）
    /// </summary>
    MonthlyByDate = 4,

    /// <summary>
    /// 毎月（曜日指定: 毎月第2火曜など）
    /// </summary>
    MonthlyByWeekday = 5,

    /// <summary>
    /// 毎年
    /// </summary>
    Yearly = 6
}
