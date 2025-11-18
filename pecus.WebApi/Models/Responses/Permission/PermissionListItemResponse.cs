using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.Permission;

/// <summary>
/// 権限リスト項目レスポンス
/// </summary>
public class PermissionListItemResponse
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

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// この権限を持つロール数
    /// </summary>
    public int RoleCount { get; set; }
}