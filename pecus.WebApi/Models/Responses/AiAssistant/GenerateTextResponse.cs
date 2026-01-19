
using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.AiAssistant;

/// <summary>
/// AIアシスタントによるテキスト生成レスポンス
/// </summary>
public class GenerateTextResponse
{
    /// <summary>
    /// 生成されたテキスト（Markdown形式）
    /// </summary>
    [Required]
    public required string GeneratedText { get; init; }
}