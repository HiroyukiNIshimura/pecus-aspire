using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.Permission;

/// <summary>
/// 権限詳細情報レスポンス
/// </summary>
public class PermissionDetailInfoResponse
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

    /// <summary>
    /// 権限の説明
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// 権限カテゴリ
    /// </summary>
    public string? Category { get; set; }
}
