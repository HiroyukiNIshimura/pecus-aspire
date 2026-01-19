using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.Agenda;

/// <summary>
/// アジェンダ更新リクエスト（シリーズ全体）
/// </summary>
public class UpdateAgendaRequest : CreateAgendaRequest
{
    [Required]
    public uint RowVersion { get; set; }
}

/// <summary>
/// アジェンダ中止リクエスト
/// </summary>
public class CancelAgendaRequest
{
    /// <summary>
    /// 中止理由
    /// </summary>
    [MaxLength(500)]
    public string? Reason { get; set; }

    [Required]
    public uint RowVersion { get; set; }

    /// <summary>
    /// 参加者へ中止通知を送信するか
    /// </summary>
    public bool SendNotification { get; set; } = true;
}

/// <summary>
/// 参加状況更新リクエスト
/// </summary>
public class UpdateAttendanceRequest
{
    /// <summary>
    /// 新しい参加状況
    /// </summary>
    [Required]
    public Libs.DB.Models.Enums.AttendanceStatus Status { get; set; }
}
