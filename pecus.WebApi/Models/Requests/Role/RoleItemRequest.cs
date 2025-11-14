namespace Pecus.Models.Requests.Role;

/// <summary>
/// ロール情報を含むリクエストDTO
/// </summary>
public class RoleItemRequest
{
    /// <summary>
    /// ロールID
    /// </summary>
    public int? Id { get; set; }

    /// <summary>
    /// 楽観的ロック用RowVersion
    /// </summary>
    public required uint RowVersion { get; set; }
}
