using System.Text.Json.Serialization;

namespace Pecus.Libs.AI.Models.Gemini;

/// <summary>
/// Gemini API リクエスト
/// </summary>
public class GeminiRequest
{
    /// <summary>
    /// コンテンツ（メッセージ履歴）
    /// </summary>
    [JsonPropertyName("contents")]
    public required List<GeminiContent> Contents { get; set; }

    /// <summary>
    /// システム指示
    /// </summary>
    [JsonPropertyName("systemInstruction")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public GeminiContent? SystemInstruction { get; set; }

    /// <summary>
    /// 生成設定
    /// </summary>
    [JsonPropertyName("generationConfig")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public GeminiGenerationConfig? GenerationConfig { get; set; }
}

/// <summary>
/// Gemini コンテンツ
/// </summary>
public class GeminiContent
{
    /// <summary>
    /// ロール（user, model）
    /// </summary>
    [JsonPropertyName("role")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Role { get; set; }

    /// <summary>
    /// パーツ（テキストなど）
    /// </summary>
    [JsonPropertyName("parts")]
    public required List<GeminiPart> Parts { get; set; }
}

/// <summary>
/// Gemini パーツ
/// </summary>
public class GeminiPart
{
    /// <summary>
    /// テキスト
    /// </summary>
    [JsonPropertyName("text")]
    public required string Text { get; set; }
}

/// <summary>
/// Gemini 生成設定
/// </summary>
public class GeminiGenerationConfig
{
    /// <summary>
    /// Temperature
    /// </summary>
    [JsonPropertyName("temperature")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public double? Temperature { get; set; }

    /// <summary>
    /// 最大出力トークン数
    /// </summary>
    [JsonPropertyName("maxOutputTokens")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public int? MaxOutputTokens { get; set; }

    /// <summary>
    /// Top P
    /// </summary>
    [JsonPropertyName("topP")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public double? TopP { get; set; }

    /// <summary>
    /// Top K
    /// </summary>
    [JsonPropertyName("topK")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public int? TopK { get; set; }

    /// <summary>
    /// レスポンスのMIMEタイプ（application/json など）
    /// </summary>
    [JsonPropertyName("responseMimeType")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? ResponseMimeType { get; set; }
}