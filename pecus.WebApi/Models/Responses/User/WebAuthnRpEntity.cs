using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.User;

/// <summary>
/// Relying Party 情報
/// </summary>
public class WebAuthnRpEntity
{
    /// <summary>
    /// Relying Party ID
    /// </summary>
    [Required]
    public required string Id { get; set; }

    /// <summary>
    /// 表示名
    /// </summary>
    [Required]
    public required string Name { get; set; }
}
