namespace Pecus.Models.Responses.Role;

/// <summary>
/// ロール情報レスポンス（簡易版）
/// </summary>
public class RoleInfoResponse
{
    /// <summary>
    /// ロールID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// ロール名
    /// </summary>
    public required string Name { get; set; }
}
