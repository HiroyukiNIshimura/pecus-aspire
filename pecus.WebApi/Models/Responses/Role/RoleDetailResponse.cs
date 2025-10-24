using Pecus.Models.Responses.Permission;

namespace Pecus.Models.Responses.Role;

/// <summary>
/// ロール詳細レスポンス（権限を含む）
/// </summary>
public class RoleDetailResponse
{
    /// <summary>
    /// ロールID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// ロール名
    /// </summary>
    public required string Name { get; set; }

    /// <summary>
    /// ロールの説明
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// ロールが持つ権限一覧
    /// </summary>
    public List<PermissionDetailInfoResponse> Permissions { get; set; } = new();
}
