using Pecus.Libs.DB.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Pecus.Libs.DB.Models;

/// <summary>
/// アジェンダ出欠回答エンティティ
/// 招待(AgendaAttendee)への出欠回答を管理する
/// </summary>
public class AgendaAttendanceResponse
{
    /// <summary>
    /// 出欠回答ID
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
    /// オカレンスインデックス（null=シリーズ全体への回答）
    /// </summary>
    public int? OccurrenceIndex { get; set; }

    /// <summary>
    /// 参加ステータス
    /// </summary>
    public AttendanceStatus Status { get; set; }

    /// <summary>
    /// 回答日時
    /// </summary>
    public DateTimeOffset RespondedAt { get; set; }

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