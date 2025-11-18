using Pecus.Models.Validation;

namespace Pecus.Models.Requests.Role;

/// <summary>
/// ロールに権限を設定するリクエスト
/// </summary>
public class SetPermissionsToRoleRequest
{
    [IntListRange(0, 200)]
    public List<int>? PermissionIds { get; set; }
}