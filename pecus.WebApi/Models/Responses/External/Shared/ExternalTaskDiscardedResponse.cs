using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.External;

/// <summary>
/// 外部公開用タスク破棄情報
/// </summary>
public class ExternalTaskDiscardedResponse
{
    /// <summary>
    /// 破棄日時
    /// </summary>
    [Required]
    public DateTimeOffset? DiscardedAt { get; set; }

    /// <summary>
    /// 破棄理由
    /// </summary>
    public string? DiscardReason { get; set; }
}