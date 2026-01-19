using Pecus.Models.Responses.Common;
using Pecus.Models.Responses.User;
using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.Agenda;

public class AgendaResponse : IConflictModel
{
    [Required]
    public required long Id { get; set; }
    [Required]
    public required int OrganizationId { get; set; }
    [Required]
    public required string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    [Required]
    public required DateTimeOffset StartAt { get; set; }
    [Required]
    public required DateTimeOffset EndAt { get; set; }
    [Required]
    public required bool IsAllDay { get; set; }
    public string? Location { get; set; }
    public string? Url { get; set; }
    public required int CreatedByUserId { get; set; }
    [Required]
    public required DateTimeOffset CreatedAt { get; set; }
    [Required]
    public required DateTimeOffset UpdatedAt { get; set; }
    [Required]
    public uint RowVersion { get; set; }

    public UserItem? CreatedByUser { get; set; }
    public List<AgendaAttendeeResponse> Attendees { get; set; } = new();
}
