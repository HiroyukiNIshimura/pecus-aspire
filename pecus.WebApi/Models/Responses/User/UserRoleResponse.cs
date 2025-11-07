using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.User;

/// <summary>
/// ユーザーロール情報レスポンス
/// </summary>
public class UserRoleResponse
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