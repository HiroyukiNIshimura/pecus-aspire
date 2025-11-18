using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.Tag;

/// <summary>
/// タグ利用アイテム（ID と名前）
/// </summary>
public class TagUsageItem
{
    /// <summary>
    /// タグID
    /// </summary>
    [Required]
    public required int Id { get; set; }

    /// <summary>
    /// タグ名
    /// </summary>
    [Required]
    public required string Name { get; set; }
}