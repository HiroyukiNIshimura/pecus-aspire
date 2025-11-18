using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.Common;

/// <summary>
/// ジョブレスポンス
/// </summary>
public class JobResponse : MessageResponse
{
    /// <summary>
    /// ジョブID
    /// </summary>
    [Required]
    public required string JobId { get; set; }
}