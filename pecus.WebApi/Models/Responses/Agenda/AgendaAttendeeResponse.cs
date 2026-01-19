using Pecus.Libs.DB.Models.Enums;
using Pecus.Models.Responses.User;
using System.Text.Json.Serialization;

namespace Pecus.Models.Responses.Agenda;

public class AgendaAttendeeResponse
{
    public required int UserId { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter<AttendanceStatus>))]
    public required AttendanceStatus Status { get; set; }
    public required bool IsOptional { get; set; }

    public UserItem? User { get; set; }
}
