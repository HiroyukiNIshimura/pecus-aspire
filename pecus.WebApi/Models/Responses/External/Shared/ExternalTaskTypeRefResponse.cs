using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.External;

/// <summary>
/// 外部公開用タスク種類参照
/// </summary>
public class ExternalTaskTypeRefResponse
{
    /// <summary>
    /// タスク種類コード
    /// </summary>
    [Required]
    public required string Code { get; set; }

    /// <summary>
    /// タスク種類名
    /// </summary>
    [Required]
    public required string Name { get; set; }
}