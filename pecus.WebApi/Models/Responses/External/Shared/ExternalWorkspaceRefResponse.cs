using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.External;

/// <summary>
/// 外部公開用ワークスペース参照
/// </summary>
public class ExternalWorkspaceRefResponse
{
    /// <summary>
    /// ワークスペースコード
    /// </summary>
    [Required]
    public required string Code { get; set; }
}