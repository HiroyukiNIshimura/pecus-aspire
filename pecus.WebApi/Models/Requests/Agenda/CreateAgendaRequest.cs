using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.Agenda;

public class CreateAgendaRequest
{
    public int? WorkspaceId { get; set; }

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    [Required]
    public DateTimeOffset StartAt { get; set; }

    [Required]
    public DateTimeOffset EndAt { get; set; }

    public bool IsAllDay { get; set; } = false;

    [MaxLength(200)]
    public string? Location { get; set; }

    [MaxLength(2000)]
    public string? Url { get; set; }

    /// <summary>
    /// 参加者リスト
    /// </summary>
    public List<AgendaAttendeeRequest> Attendees { get; set; } = new();
}

public class AgendaAttendeeRequest
{
    public int UserId { get; set; }
    public bool IsOptional { get; set; } = false;
}
