namespace Pecus.Libs.Focus.Models;

/// <summary>
/// 今日のアジェンダ情報（AI コンテキスト用）
/// </summary>
public class TodayAgendaInfo
{
    /// <summary>
    /// アジェンダID
    /// </summary>
    public long Id { get; set; }

    /// <summary>
    /// タイトル
    /// </summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// 開始日時（UTC）
    /// </summary>
    public DateTimeOffset StartAt { get; set; }

    /// <summary>
    /// 終了日時（UTC）
    /// </summary>
    public DateTimeOffset EndAt { get; set; }

    /// <summary>
    /// 終日イベントフラグ
    /// </summary>
    public bool IsAllDay { get; set; }

    /// <summary>
    /// 場所
    /// </summary>
    public string? Location { get; set; }
}
