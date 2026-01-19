using Pecus.Models.Responses.Common;
using Pecus.Models.Responses.User;

namespace Pecus.Models.Responses.Agenda;

public class AgendaResponse : IConflictModel
{
    public long Id { get; set; }
    public int OrganizationId { get; set; }
    public int? WorkspaceId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTimeOffset StartAt { get; set; }
    public DateTimeOffset EndAt { get; set; }
    public bool IsAllDay { get; set; }
    public string? Location { get; set; }
    public string? Url { get; set; }
    public int CreatedByUserId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public uint RowVersion { get; set; }

    public UserItem? CreatedByUser { get; set; }
    public List<AgendaAttendeeResponse> Attendees { get; set; } = new();
}
