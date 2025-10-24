using Pecus.Models.Responses.Role;

namespace Pecus.Models.Responses.Permission;

/// <summary>
/// 権限詳細レスポンス（ロールを含む）
/// </summary>
public class PermissionDetailResponse
{
    /// <summary>
    /// 権限ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 権限名
    /// </summary>
    public required string Name { get; set; }

    /// <summary>
    /// 権限の説明
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// 権限カテゴリ
    /// </summary>
    public string? Category { get; set; }

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// この権限を持つロール一覧
    /// </summary>
    public List<RoleInfoResponse> Roles { get; set; } = new();
}
