namespace Pecus.Models.Requests;

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
    public required byte[] RowVersion { get; set; }
}
