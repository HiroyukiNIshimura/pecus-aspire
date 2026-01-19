using Pecus.Libs.DB.Models.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Pecus.Libs.DB.Models;

/// <summary>
/// アジェンダ参加者エンティティ
/// 中間テーブルとして機能する
/// </summary>
public class AgendaAttendee
{
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
    /// 参加ステータス
    /// </summary>
    public AttendanceStatus Status { get; set; } = AttendanceStatus.Pending;

    /// <summary>
    /// 任意参加フラグ（false=必須参加）
    /// </summary>
    public bool IsOptional { get; set; } = false;

    // Navigation Properties

    public Agenda? Agenda { get; set; }
    public User? User { get; set; }
}
