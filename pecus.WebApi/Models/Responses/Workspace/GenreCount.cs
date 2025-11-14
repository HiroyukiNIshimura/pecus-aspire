using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.Workspace;

/// <summary>
/// ジャンルごとのワークスペース数
/// </summary>
public class GenreCount
{
    /// <summary>
    /// ジャンルID
    /// </summary>
    [Required]
    public required int GenreId { get; set; }

    /// <summary>
    /// ジャンル名
    /// </summary>
    [Required]
    public required string GenreName { get; set; } = string.Empty;

    /// <summary>
    /// ワークスペース数
    /// </summary>
    [Required]
    public required int Count { get; set; } = 0;
}