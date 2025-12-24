using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.AiAssistant;

/// <summary>
/// AIアシスタントによるテキスト生成リクエスト
/// </summary>
public class GenerateTextRequest
{
    /// <summary>
    /// エディタ全体のMarkdownコンテンツ（カーソル位置マーカー含む）
    /// </summary>
    [Required]
    [MaxLength(100000)]
    public required string Markdown { get; init; }

    /// <summary>
    /// カーソル位置を示すマーカー文字列
    /// </summary>
    [Required]
    [MaxLength(50)]
    public required string CursorMarker { get; init; }

    /// <summary>
    /// ユーザーからの指示（何を生成してほしいか）
    /// </summary>
    [Required]
    [MaxLength(1000)]
    public required string UserPrompt { get; init; }
}
