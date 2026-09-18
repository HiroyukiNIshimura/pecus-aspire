using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.External;

/// <summary>
/// 外部公開用アイテム参照
/// </summary>
public class ExternalItemRefResponse
{
    /// <summary>
    /// アイテム番号（ワークスペース内連番）
    /// </summary>
    [Required]
    public int ItemNumber { get; set; }
}