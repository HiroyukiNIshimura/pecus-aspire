using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.Organization;

/// <summary>
/// 組織のアクティブ状態変更リクエスト
/// </summary>
public class SetOrganizationActiveStatusRequest
{
    [Required(ErrorMessage = "IsActiveは必須です。")]
    public required bool IsActive { get; set; }

    [Required(ErrorMessage = "RowVersionは必須です。")]
    public required uint RowVersion { get; set; }
}
