using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.External;

/// <summary>
/// 外部公開用タスク参照
/// </summary>
public class ExternalTaskRefResponse
{
    /// <summary>
    /// シーケンス番号
    /// </summary>
    [Required]
    public int Sequence { get; set; }
}