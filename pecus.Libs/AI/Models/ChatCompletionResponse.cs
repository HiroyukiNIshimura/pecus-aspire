using System.Text.Json.Serialization;

namespace Pecus.Libs.AI.Models;

/// <summary>
/// DeepSeek Chat Completion レスポンス
/// </summary>
public class ChatCompletionResponse
{
    /// <summary>
    /// リクエストID
    /// </summary>
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    /// <summary>
    /// オブジェクトタイプ
    /// </summary>
    [JsonPropertyName("object")]
    public string Object { get; set; } = string.Empty;

    /// <summary>
    /// 作成日時（Unix timestamp）
    /// </summary>
    [JsonPropertyName("created")]
    public long Created { get; set; }

    /// <summary>
    /// 使用されたモデル
    /// </summary>
    [JsonPropertyName("model")]
    public string Model { get; set; } = string.Empty;

    /// <summary>
    /// 生成された選択肢
    /// </summary>
    [JsonPropertyName("choices")]
    public List<ChatChoice> Choices { get; set; } = [];

    /// <summary>
    /// トークン使用量
    /// </summary>
    [JsonPropertyName("usage")]
    public ChatUsage? Usage { get; set; }
}

/// <summary>
/// 生成された選択肢
/// </summary>
public class ChatChoice
{
    /// <summary>
    /// 選択肢のインデックス
    /// </summary>
    [JsonPropertyName("index")]
    public int Index { get; set; }

    /// <summary>
    /// 生成されたメッセージ
    /// </summary>
    [JsonPropertyName("message")]
    public ChatMessage Message { get; set; } = null!;

    /// <summary>
    /// 終了理由
    /// </summary>
    [JsonPropertyName("finish_reason")]
    public string? FinishReason { get; set; }
}

/// <summary>
/// トークン使用量
/// </summary>
public class ChatUsage
{
    /// <summary>
    /// プロンプトトークン数
    /// </summary>
    [JsonPropertyName("prompt_tokens")]
    public int PromptTokens { get; set; }

    /// <summary>
    /// 生成トークン数
    /// </summary>
    [JsonPropertyName("completion_tokens")]
    public int CompletionTokens { get; set; }

    /// <summary>
    /// 合計トークン数
    /// </summary>
    [JsonPropertyName("total_tokens")]
    public int TotalTokens { get; set; }
}