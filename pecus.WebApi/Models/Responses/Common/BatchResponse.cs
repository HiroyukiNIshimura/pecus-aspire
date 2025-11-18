using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.Common;

/// <summary>
/// バッチジョブレスポンス
/// </summary>
public class BatchResponse : MessageResponse
{
    /// <summary>
    /// ジョブIDのリスト
    /// </summary>
    [Required]
    public required List<string> JobIds { get; set; }
}