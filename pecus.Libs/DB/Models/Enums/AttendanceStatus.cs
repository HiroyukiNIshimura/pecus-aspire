namespace Pecus.Libs.DB.Models.Enums;

/// <summary>
/// アジェンダへの参加状況
/// </summary>
public enum AttendanceStatus
{
    /// <summary>
    /// 未回答・保留
    /// </summary>
    Pending = 0,

    /// <summary>
    /// 参加（承諾）
    /// </summary>
    Accepted = 1,

    /// <summary>
    /// 不参加（辞退）
    /// </summary>
    Declined = 2,

    /// <summary>
    /// 仮承諾
    /// </summary>
    Tentative = 3
}