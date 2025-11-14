using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.Organization;

/// <summary>
/// 組織削除リクエスト
/// </summary>
public class DeleteOrganizationRequest
{
    [Required(ErrorMessage = "RowVersionは必須です。")]
    public required uint RowVersion { get; set; }
}
