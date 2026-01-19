namespace Pecus.Libs.DB.Models.Enums;

/// <summary>
/// リマインダーのタイミング（分単位）
/// UIやAPIでの参照用定義（DBには分数を直接保存）
/// </summary>
public enum ReminderTiming
{
    /// <summary>
    /// 開始時
    /// </summary>
    AtStart = 0,

    /// <summary>
    /// 5分前
    /// </summary>
    Minutes5 = 5,

    /// <summary>
    /// 15分前
    /// </summary>
    Minutes15 = 15,

    /// <summary>
    /// 30分前
    /// </summary>
    Minutes30 = 30,

    /// <summary>
    /// 1時間前
    /// </summary>
    Hours1 = 60,

    /// <summary>
    /// 2時間前
    /// </summary>
    Hours2 = 120,

    /// <summary>
    /// 1日前
    /// </summary>
    Days1 = 1440,

    /// <summary>
    /// 2日前
    /// </summary>
    Days2 = 2880,

    /// <summary>
    /// 1週間前
    /// </summary>
    Weeks1 = 10080
}
