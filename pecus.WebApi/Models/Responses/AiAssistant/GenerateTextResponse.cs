namespace Pecus.Models.Responses.AiAssistant;

/// <summary>
/// AIアシスタントによるテキスト生成レスポンス
/// </summary>
public class GenerateTextResponse
{
    /// <summary>
    /// 生成されたテキスト（Markdown形式）
    /// </summary>
    public required string GeneratedText { get; init; }
}
