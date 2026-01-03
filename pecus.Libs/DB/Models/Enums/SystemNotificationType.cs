namespace Pecus.Libs.DB.Models.Enums;

/// <summary>
/// システム通知の種類
/// </summary>
public enum SystemNotificationType
{
    /// <summary>
    /// 緊急メンテナンス
    /// </summary>
    EmergencyMaintenance,

    /// <summary>
    /// 定期メンテナンス
    /// </summary>
    ScheduledMaintenance,

    /// <summary>
    /// 重要
    /// </summary>
    Important,

    /// <summary>
    /// お知らせ
    /// </summary>
    Info,

    /// <summary>
    /// 障害報告
    /// </summary>
    IncidentReport,
}