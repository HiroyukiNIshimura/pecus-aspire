using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.Role;

/// <summary>
/// ロール情報レスポンス（簡易版）
/// </summary>
public class RoleInfoResponse
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
}

