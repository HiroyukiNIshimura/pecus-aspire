using System.ComponentModel.DataAnnotations;

namespace Pecus.Libs.DB.Models;

/// <summary>
/// アジェンダリマインダー送信ログエンティティ
/// 繰り返しイベントの各回に対して、どのリマインダーを送信済みかを追跡する
/// </summary>
public class AgendaReminderLog
{
    /// <summary>
    /// ID
    /// </summary>
    public long Id { get; set; }

    /// <summary>
    /// アジェンダID
    /// </summary>
    [Required]
    public long AgendaId { get; set; }

    /// <summary>
    /// ユーザーID
    /// </summary>
    [Required]
    public int UserId { get; set; }

    /// <summary>
    /// 対象回の開始日時（繰り返しの特定回を識別）
    /// </summary>
    [Required]
    public DateTimeOffset OccurrenceStartAt { get; set; }

    /// <summary>
    /// 何分前のリマインダーか（1440=1日前, 60=1時間前など）
    /// </summary>
    [Required]
    public int MinutesBefore { get; set; }

    /// <summary>
    /// 送信日時
    /// </summary>
    public DateTimeOffset SentAt { get; set; } = DateTimeOffset.UtcNow;

    // Navigation Properties

    /// <summary>
    /// アジェンダ
    /// </summary>
    public Agenda? Agenda { get; set; }

    /// <summary>
    /// ユーザー
    /// </summary>
    public User? User { get; set; }
}
