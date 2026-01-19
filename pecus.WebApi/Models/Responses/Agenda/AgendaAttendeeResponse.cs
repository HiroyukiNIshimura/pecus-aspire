using Pecus.Libs.DB.Models.Enums;
using Pecus.Models.Responses.User;

namespace Pecus.Models.Responses.Agenda;

public class AgendaAttendeeResponse
{
    public int UserId { get; set; }
    public AttendanceStatus Status { get; set; }
    public bool IsOptional { get; set; }

    public UserItem? User { get; set; }
}
