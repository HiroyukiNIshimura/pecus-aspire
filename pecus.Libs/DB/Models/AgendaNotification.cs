using Pecus.Libs.DB.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Pecus.Libs.DB.Models;

/// <summary>
/// アジェンダ通知エンティティ
/// イベントの招待、変更、中止、リマインダーなどの通知を管理する
/// </summary>
public class AgendaNotification
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
    /// 対象ユーザーID
    /// </summary>
    [Required]
    public int UserId { get; set; }

    /// <summary>
    /// 通知タイプ
    /// </summary>
    [Required]
    public AgendaNotificationType Type { get; set; }

    /// <summary>
    /// 対象の開始日時（繰り返しの特定回を識別、単発やシリーズ全体の場合はnull）
    /// </summary>
    public DateTimeOffset? OccurrenceStartAt { get; set; }

    /// <summary>
    /// 通知メッセージ（変更内容の要約など）
    /// </summary>
    [MaxLength(500)]
    public string? Message { get; set; }

    /// <summary>
    /// 既読フラグ
    /// </summary>
    public bool IsRead { get; set; } = false;

    /// <summary>
    /// メール送信済みフラグ
    /// </summary>
    public bool IsEmailSent { get; set; } = false;

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    /// <summary>
    /// 通知を作成したユーザーID（招待者、変更者など）
    /// </summary>
    public int? CreatedByUserId { get; set; }

    // Navigation Properties

    /// <summary>
    /// アジェンダ
    /// </summary>
    public Agenda? Agenda { get; set; }

    /// <summary>
    /// 対象ユーザー
    /// </summary>
    public User? User { get; set; }

    /// <summary>
    /// 通知を作成したユーザー
    /// </summary>
    public User? CreatedByUser { get; set; }
}
