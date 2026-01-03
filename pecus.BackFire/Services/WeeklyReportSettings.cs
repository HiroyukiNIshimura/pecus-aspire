namespace Pecus.BackFire.Services;

/// <summary>
/// 週間レポートの設定
/// </summary>
public class WeeklyReportSettings
{
    /// <summary>
    /// 設定セクション名
    /// </summary>
    public const string SectionName = "WeeklyReport";

    /// <summary>
    /// 配信時刻（時）デフォルト: 8時
    /// </summary>
    public int DeliveryHour { get; set; } = 8;

    /// <summary>
    /// 配信時刻（分）デフォルト: 0分
    /// </summary>
    public int DeliveryMinute { get; set; } = 0;
}