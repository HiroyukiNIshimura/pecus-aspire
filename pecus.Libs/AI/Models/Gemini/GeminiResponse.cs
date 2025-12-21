using System.Text.Json.Serialization;

namespace Pecus.Libs.AI.Models.Gemini;

/// <summary>
/// Gemini API レスポンス
/// </summary>
public class GeminiResponse
{
    /// <summary>
    /// 候補
    /// </summary>
    [JsonPropertyName("candidates")]
    public List<GeminiCandidate> Candidates { get; set; } = [];

    /// <summary>
    /// 使用量メタデータ
    /// </summary>
    [JsonPropertyName("usageMetadata")]
    public GeminiUsageMetadata? UsageMetadata { get; set; }
}

/// <summary>
/// Gemini 候補
/// </summary>
public class GeminiCandidate
{
    /// <summary>
    /// コンテンツ
    /// </summary>
    [JsonPropertyName("content")]
    public GeminiContent? Content { get; set; }

    /// <summary>
    /// 終了理由
    /// </summary>
    [JsonPropertyName("finishReason")]
    public string? FinishReason { get; set; }

    /// <summary>
    /// インデックス
    /// </summary>
    [JsonPropertyName("index")]
    public int Index { get; set; }
}

/// <summary>
/// Gemini 使用量メタデータ
/// </summary>
public class GeminiUsageMetadata
{
    /// <summary>
    /// プロンプトトークン数
    /// </summary>
    [JsonPropertyName("promptTokenCount")]
    public int PromptTokenCount { get; set; }

    /// <summary>
    /// 候補トークン数
    /// </summary>
    [JsonPropertyName("candidatesTokenCount")]
    public int CandidatesTokenCount { get; set; }

    /// <summary>
    /// 合計トークン数
    /// </summary>
    [JsonPropertyName("totalTokenCount")]
    public int TotalTokenCount { get; set; }
}