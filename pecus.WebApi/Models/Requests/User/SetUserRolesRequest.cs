using Pecus.Models.Validation;
using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.User;

/// <summary>
/// ユーザーロール設定リクエスト
/// </summary>
public class SetUserRolesRequest
{
    [Required(ErrorMessage = "ロールIDリストは必須です。")]
    [IntListRange(1, 5)]
    public required List<int> Roles { get; set; }

    public uint? UserRowVersion { get; set; }
}
