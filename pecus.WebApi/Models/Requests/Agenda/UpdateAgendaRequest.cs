using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.Agenda;

public class UpdateAgendaRequest : CreateAgendaRequest
{
    [Required]
    public uint RowVersion { get; set; }
}
