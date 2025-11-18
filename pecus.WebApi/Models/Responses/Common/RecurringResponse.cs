using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.Common;

/// <summary>
/// 繰り返しジョブレスポンス
/// </summary>
public class RecurringResponse : MessageResponse
{
    /// <summary>
    /// 繰り返しジョブID
    /// </summary>
    [Required]
    public required string RecurringJobId { get; set; }
}