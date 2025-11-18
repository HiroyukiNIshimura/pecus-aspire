using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.Permission;

/// <summary>
/// 権限情報レスポンス（簡易版）
/// </summary>
public class PermissionInfoResponse
{
    /// <summary>
    /// 権限ID
    /// </summary>
    [Required]
    public required int Id { get; set; }

    /// <summary>
    /// 権限名
    /// </summary>
    [Required]
    public required string Name { get; set; }
}