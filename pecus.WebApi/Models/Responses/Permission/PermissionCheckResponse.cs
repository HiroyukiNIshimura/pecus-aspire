namespace Pecus.Models.Responses.Permission;

/// <summary>
/// 権限確認レスポンス
/// </summary>
public class PermissionCheckResponse
{
    /// <summary>
    /// ユーザーID
    /// </summary>
    public int UserId { get; set; }

    /// <summary>
    /// 権限名
    /// </summary>
    public required string PermissionName { get; set; }

    /// <summary>
    /// 権限を持っているか
    /// </summary>
    public bool HasPermission { get; set; }
}
