using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.Organization;

public class GetOrganizationsRequest
{
    [Range(1, int.MaxValue, ErrorMessage = "ページ番号は1以上で指定してください。")]
    public int? Page { get; set; } = 1;

    public bool? ActiveOnly { get; set; } = true;
}