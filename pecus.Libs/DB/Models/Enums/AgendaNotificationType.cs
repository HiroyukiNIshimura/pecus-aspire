namespace Pecus.Libs.DB.Models.Enums;

/// <summary>
/// アジェンダ通知タイプ
/// </summary>
public enum AgendaNotificationType
{
    /// <summary>
    /// 新規招待
    /// </summary>
    Invited = 0,

    /// <summary>
    /// シリーズ全体の変更
    /// </summary>
    SeriesUpdated = 1,

    /// <summary>
    /// シリーズ全体の中止
    /// </summary>
    SeriesCancelled = 2,

    /// <summary>
    /// 特定回の変更
    /// </summary>
    OccurrenceUpdated = 3,

    /// <summary>
    /// 特定回の中止
    /// </summary>
    OccurrenceCancelled = 4,

    /// <summary>
    /// リマインダー
    /// </summary>
    Reminder = 5,

    /// <summary>
    /// 参加者追加（既存イベントへの招待）
    /// </summary>
    AddedToEvent = 6,

    /// <summary>
    /// 参加者削除
    /// </summary>
    RemovedFromEvent = 7,

    /// <summary>
    /// 参加者が不参加に変更
    /// </summary>
    AttendanceDeclined = 8
}
