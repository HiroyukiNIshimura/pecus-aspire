using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.External;

/// <summary>
/// 外部公開用先行タスク参照
/// </summary>
public class ExternalPredecessorTaskResponse
{
    /// <summary>
    /// シーケンス番号
    /// </summary>
    [Required]
    public int Sequence { get; set; }
}