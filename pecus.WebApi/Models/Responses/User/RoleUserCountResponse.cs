using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.User;

/// <summary>
/// ロールごとのユーザー数
/// </summary>
public class RoleUserCountResponse
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
    /// ユーザー数
    /// </summary>
    [Required]
    public required int Count { get; set; } = 0;
}