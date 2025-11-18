using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.Common;

/// <summary>
/// 継続ジョブレスポンス
/// </summary>
public class ContinuationResponse : MessageResponse
{
    /// <summary>
    /// 親ジョブID
    /// </summary>
    [Required]
    public required string ParentJobId { get; set; }

    /// <summary>
    /// 子ジョブID
    /// </summary>
    [Required]
    public required string ChildJobId { get; set; }
}