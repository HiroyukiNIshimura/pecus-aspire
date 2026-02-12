using System.ComponentModel.DataAnnotations;

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
    /// 任意参加フラグ（false=必須参加）
    /// </summary>
    public bool IsOptional { get; set; } = false;

    /// <summary>
    /// 個人のリマインダー設定（null=デフォルト使用、カンマ区切り分）
    /// </summary>
    [MaxLength(50)]
    public string? CustomReminders { get; set; }

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