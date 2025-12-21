using System.Text.Json.Serialization;

namespace Pecus.Libs.AI.Models;

/// <summary>
/// DeepSeek Chat Completion リクエスト
/// </summary>
public class ChatCompletionRequest
{
    /// <summary>
    /// 使用するモデル名
    /// </summary>
    [JsonPropertyName("model")]
    public required string Model { get; set; }

    /// <summary>
    /// メッセージ履歴
    /// </summary>
    [JsonPropertyName("messages")]
    public required List<ChatMessage> Messages { get; set; }

    /// <summary>
    /// Temperature（0.0-2.0）
    /// 高いほどランダム性が増す
    /// </summary>
    [JsonPropertyName("temperature")]
    public double Temperature { get; set; } = 0.7;

    /// <summary>
    /// 生成する最大トークン数
    /// </summary>
    [JsonPropertyName("max_tokens")]
    public int MaxTokens { get; set; } = 2048;

    /// <summary>
    /// ストリーミングモードを有効にするか
    /// </summary>
    [JsonPropertyName("stream")]
    public bool Stream { get; set; } = false;

    /// <summary>
    /// Top P（Nucleus Sampling）
    /// </summary>
    [JsonPropertyName("top_p")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public double? TopP { get; set; }

    /// <summary>
    /// 頻度ペナルティ（-2.0 to 2.0）
    /// </summary>
    [JsonPropertyName("frequency_penalty")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public double? FrequencyPenalty { get; set; }

    /// <summary>
    /// 存在ペナルティ（-2.0 to 2.0）
    /// </summary>
    [JsonPropertyName("presence_penalty")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public double? PresencePenalty { get; set; }

    /// <summary>
    /// 停止シーケンス
    /// </summary>
    [JsonPropertyName("stop")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public List<string>? Stop { get; set; }

    /// <summary>
    /// レスポンス形式の指定
    /// </summary>
    [JsonPropertyName("response_format")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public ResponseFormat? ResponseFormat { get; set; }
}