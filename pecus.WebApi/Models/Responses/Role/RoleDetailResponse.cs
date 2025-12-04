using Pecus.Models.Responses.Permission;
using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.Role;

/// <summary>
/// ロール詳細レスポンス（権限を含む）
/// </summary>
public class RoleDetailResponse
{
    /// <summary>
    /// ロールID
    /// </summary>
    [Required]
    public required int Id { get; set; }

    /// <summary>
    /// ロール名
    /// </summary>
    [Required]
    public required string Name { get; set; }

    /// <summary>
    /// ロールの説明
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTimeOffset CreatedAt { get; set; }

    /// <summary>
    /// ロールが持つ権限一覧
    /// </summary>
    public List<PermissionDetailInfoResponse> Permissions { get; set; } = new();

    /// <summary>
    /// 楽観的ロック用のRowVersion
    /// </summary>
    [Required]
    public required uint RowVersion { get; set; }
}