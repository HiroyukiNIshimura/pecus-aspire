using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.Role;

/// <summary>
/// ロール情報レスポンス
/// </summary>
public class RoleResponse
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
    public DateTime CreatedAt { get; set; }
}
