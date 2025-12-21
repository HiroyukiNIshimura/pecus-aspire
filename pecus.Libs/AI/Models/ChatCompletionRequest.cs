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
    /// 注: OpenAI の推論モデル（o1, o3 シリーズなど）は temperature をサポートしない
    /// </summary>
    [JsonPropertyName("temperature")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public double? Temperature { get; set; }

    /// <summary>
    /// 生成する最大トークン数（レガシー: DeepSeek など max_tokens をサポートするAPI用）
    /// OpenAI の新しいモデル（gpt-4o, o1 など）では max_completion_tokens を使用すること
    /// </summary>
    [JsonPropertyName("max_tokens")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public int? MaxTokens { get; set; }

    /// <summary>
    /// 生成する最大トークン数（新しいモデル用: gpt-4o, o1 など）
    /// OpenAI の新しいモデルでは max_tokens ではなく max_completion_tokens を使用する必要がある
    /// </summary>
    [JsonPropertyName("max_completion_tokens")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public int? MaxCompletionTokens { get; set; }

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